/**
 * 最新デプロイURLでのE2Eテスト
 */
const { chromium } = require('@playwright/test');

const BASE_URL = 'https://adam-pw5v371d6-pedr-hb-j-s-projects.vercel.app';
const MASTER_EMAIL = 'pedro.inoue@hb-jp.com';
const MASTER_PASS = 'ChangeMe123!';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // キャプチャ
  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('/api/auth') || url.includes('/auth/')) {
      let body = '';
      try { body = await resp.text(); } catch(e) {}
      console.log(`<< ${resp.status()} ${url}`);
      if (body) console.log('   BODY:', body.slice(0, 300));
    }
  });

  try {
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page URL:', page.url());
    
    await page.fill('input[type="email"]', MASTER_EMAIL);
    await page.fill('input[type="password"]', MASTER_PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(8000);
    
    console.log('Final URL:', page.url());
    const content = await page.textContent('body');
    console.log('Content snippet:', content.slice(0, 200));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
