/**
 * ブラウザからNextAuth v5のsignIn相当を実行してセッションを確認
 */
const { chromium } = require('@playwright/test');

const BASE_URL = 'https://adam-seven-gamma.vercel.app';
const MASTER_EMAIL = 'pedro.inoue@hb-jp.com';
const MASTER_PASS = 'ChangeMe123!';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 全リクエスト/レスポンスをログ
  page.on('request', req => {
    if (req.url().includes('/api/auth') || req.url().includes('/_next')) return;
    console.log(`>> ${req.method()} ${req.url()}`);
  });
  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('/api/auth')) {
      let body = '';
      try { body = await resp.text(); } catch(e) {}
      const loc = resp.headers()['location'] || '';
      console.log(`<< ${resp.status()} ${url}${loc ? ' → ' + loc : ''}`);
      if (body && !body.includes('<html')) console.log('   BODY:', body.slice(0, 300));
    }
  });

  try {
    // ログインページに移動
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('1. Login page loaded:', page.url());
    
    // フォーム入力
    await page.fill('input[type="email"]', MASTER_EMAIL);
    await page.fill('input[type="password"]', MASTER_PASS);
    
    // ボタンクリック（submitイベント発火）
    await page.click('button[type="submit"]');
    
    // 10秒待機
    await page.waitForTimeout(10000);
    
    console.log('2. After login URL:', page.url());
    
    // セッション確認
    const sessionResult = await page.evaluate(async () => {
      const r = await fetch('/api/auth/session');
      return await r.json();
    });
    console.log('3. Session:', JSON.stringify(sessionResult));
    
    // Cookieを確認
    const cookies = await context.cookies(BASE_URL);
    console.log('4. Cookies:');
    cookies.forEach(c => {
      console.log(`   ${c.name}=${c.value.slice(0, 30)}... secure=${c.secure}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
