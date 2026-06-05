/**
 * 追加診断スクリプト: ログインエラー詳細確認
 */
const { chromium } = require('@playwright/test');

const BASE_URL = 'https://adam-seven-gamma.vercel.app';
const MASTER_EMAIL = 'pedro.inoue@hb-jp.com';
const MASTER_PASS = 'ChangeMe123!';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // ネットワークリクエストをモニタリング
  const requests = [];
  const responses = [];
  page.on('request', req => {
    if (req.url().includes('/api/') || req.url().includes('/auth/')) {
      requests.push({ method: req.method(), url: req.url(), postData: req.postData() });
    }
  });
  page.on('response', async resp => {
    if (resp.url().includes('/api/') || resp.url().includes('/auth/')) {
      let body = '';
      try { body = await resp.text(); } catch(e) {}
      responses.push({ status: resp.status(), url: resp.url(), body: body.slice(0, 500) });
    }
  });

  try {
    // ログインページ確認
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('=== ログインページHTML ===');
    const html = await page.content();
    
    // フォームの詳細
    const forms = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      return Array.from(forms).map(f => ({
        action: f.action,
        method: f.method,
        inputs: Array.from(f.querySelectorAll('input')).map(i => ({
          name: i.name, type: i.type, id: i.id
        })),
        buttons: Array.from(f.querySelectorAll('button')).map(b => ({
          type: b.type, text: b.textContent.trim()
        }))
      }));
    });
    console.log('フォーム:', JSON.stringify(forms, null, 2));
    
    // ログイン試行 - フォームの実際のfieldを使用
    const emailField = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(i => ({ name: i.name, type: i.type, id: i.id, placeholder: i.placeholder }));
    });
    console.log('全input:', JSON.stringify(emailField, null, 2));
    
    // ログイン実行
    console.log('\n=== ログイン試行 ===');
    
    // email入力
    const emailInput = page.locator('input').filter({ hasAttribute: 'type' }).first();
    console.log('email input count:', await page.locator('input[type="email"]').count());
    console.log('password input count:', await page.locator('input[type="password"]').count());
    console.log('all input count:', await page.locator('input').count());
    
    await page.fill('input[type="email"]', MASTER_EMAIL);
    await page.fill('input[type="password"]', MASTER_PASS);
    
    // ネットワーク応答を見る
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth') || resp.url().includes('/auth'), { timeout: 15000 }).catch(() => null),
      page.click('button[type="submit"]')
    ]);
    
    if (response) {
      let respBody = '';
      try { respBody = await response.text(); } catch(e) {}
      console.log('Auth response status:', response.status());
      console.log('Auth response URL:', response.url());
      console.log('Auth response body:', respBody.slice(0, 1000));
    }
    
    await page.waitForTimeout(5000);
    console.log('Final URL:', page.url());
    
    // エラーページの内容
    const errorBody = await page.textContent('body');
    console.log('Page content:', errorBody.slice(0, 500));
    
    // レスポンス一覧
    console.log('\n=== API Responses ===');
    for (const r of responses) {
      console.log(`${r.status} ${r.url}`);
      console.log('  body:', r.body.slice(0, 200));
    }
    
    // /api/auth/error の内容
    console.log('\n=== /api/auth/error ページ ===');
    await page.goto(BASE_URL + '/api/auth/error', { waitUntil: 'networkidle', timeout: 15000 });
    const errPageContent = await page.textContent('body');
    console.log(errPageContent.slice(0, 500));
    
    // NEXTAUTH_URL などの環境変数設定確認
    console.log('\n=== /api/auth/providers ===');
    await page.goto(BASE_URL + '/api/auth/providers', { waitUntil: 'networkidle', timeout: 15000 });
    const providers = await page.textContent('body');
    console.log(providers.slice(0, 500));
    
    console.log('\n=== /api/auth/csrf ===');
    await page.goto(BASE_URL + '/api/auth/csrf', { waitUntil: 'networkidle', timeout: 15000 });
    const csrf = await page.textContent('body');
    console.log(csrf.slice(0, 300));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
