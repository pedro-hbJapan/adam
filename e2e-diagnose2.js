/**
 * 詳細診断: ログインフォームのsubmitを正確に再現
 */
const { chromium } = require('@playwright/test');

const BASE_URL = 'https://adam-seven-gamma.vercel.app';
const MASTER_EMAIL = 'pedro.inoue@hb-jp.com';
const MASTER_PASS = 'ChangeMe123!';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 全リクエスト/レスポンスをキャプチャ
  page.on('request', req => {
    console.log(`>> ${req.method()} ${req.url()}`);
    const post = req.postData();
    if (post) console.log('   POST:', post.slice(0, 200));
  });
  page.on('response', async resp => {
    const url = resp.url();
    let body = '';
    try { body = await resp.text(); } catch(e) {}
    console.log(`<< ${resp.status()} ${url}`);
    if (body && body.length > 0) console.log('   BODY:', body.slice(0, 300));
  });

  try {
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('\n--- フォーム送信 ---');
    
    await page.fill('input[type="email"]', MASTER_EMAIL);
    await page.fill('input[type="password"]', MASTER_PASS);
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(8000);
    
    console.log('\nFinal URL:', page.url());
    const content = await page.textContent('body');
    console.log('Page text:', content.slice(0, 300));
    
    // エラーメッセージ確認
    const errorEl = await page.locator('[style*="error"], p').first().textContent().catch(() => '');
    console.log('Error element:', errorEl);
    
    // ページのHTML
    const html = await page.content();
    // エラー関連部分のみ
    const errorSection = html.match(/<[^>]*error[^>]*>[^<]*<\/[^>]+>/gi)?.join('\n') || '';
    console.log('Error HTML:', errorSection.slice(0, 500));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
