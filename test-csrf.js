/**
 * CSRF Cookie の詳細診断
 */
const { chromium } = require('@playwright/test');

const BASE_URL = 'https://adam-seven-gamma.vercel.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // GETで/api/auth/csrfを取得（CSRFトークンを設定させる）
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Cookieを確認
    const cookies = await context.cookies(BASE_URL);
    console.log('Cookies after loading login page:');
    cookies.forEach(c => {
      console.log(`  ${c.name}=${c.value.slice(0, 20)}... secure=${c.secure} httpOnly=${c.httpOnly} sameSite=${c.sameSite}`);
    });
    
    // CSRFトークンをAPIから取得
    const csrfResponse = await page.evaluate(async () => {
      const r = await fetch('/api/auth/csrf');
      return await r.json();
    });
    console.log('\nCSRF token from API:', csrfResponse.csrfToken?.slice(0, 20) + '...');
    
    // 再度Cookieを確認
    const cookies2 = await context.cookies(BASE_URL);
    console.log('\nCookies after CSRF fetch:');
    cookies2.forEach(c => {
      console.log(`  ${c.name}=${c.value.slice(0, 30)}... secure=${c.secure} httpOnly=${c.httpOnly} sameSite=${c.sameSite}`);
    });
    
    // 手動でPOSTしてみる
    console.log('\nManual POST to callback:');
    const postResult = await page.evaluate(async (csrfToken) => {
      const body = new URLSearchParams({
        email: 'pedro.inoue@hb-jp.com',
        password: 'ChangeMe123!',
        csrfToken: csrfToken,
        callbackUrl: 'https://adam-seven-gamma.vercel.app/'
      });
      
      const response = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        redirect: 'manual'
      });
      
      let responseBody = '';
      try { responseBody = await response.text(); } catch(e) {}
      
      return {
        status: response.status,
        redirected: response.redirected,
        url: response.url,
        body: responseBody.slice(0, 500)
      };
    }, csrfResponse.csrfToken);
    
    console.log('POST result:', JSON.stringify(postResult, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
