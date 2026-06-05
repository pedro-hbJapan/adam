/**
 * SALESユーザーでのログインテスト
 */
const { chromium } = require('@playwright/test');

const BASE_URL = 'https://adam-seven-gamma.vercel.app';
const MASTER_EMAIL = 'pedro.inoue@hb-jp.com';
const MASTER_PASS = 'ChangeMe123!';
const SALES_EMAIL = 'test-sales@example.com';
const SALES_PASS = 'TestPass123!';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('/api/auth')) {
      let body = '';
      try { body = await resp.text(); } catch(e) {}
      const loc = resp.headers()['location'] || '';
      console.log(`<< ${resp.status()} ${url}${loc ? ' → ' + loc : ''}`);
      if (body && !body.includes('<html') && body.length < 500) console.log('   BODY:', body);
    }
  });

  try {
    // Step 1: MASTERでログインしてSALESユーザーを作成
    console.log('=== Step 1: MASTERログイン ===');
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.fill('input[type="email"]', MASTER_EMAIL);
    await page.fill('input[type="password"]', MASTER_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/master', { timeout: 15000 });
    console.log('MASTER ログイン成功:', page.url());
    
    // Step 2: SALESユーザーを作成
    console.log('\n=== Step 2: SALESユーザー作成 ===');
    await page.goto(BASE_URL + '/master/users', { waitUntil: 'networkidle', timeout: 30000 });
    
    // ユーザーが既に存在しているか確認
    const bodyText = await page.textContent('body');
    if (bodyText.includes(SALES_EMAIL)) {
      console.log('SALESユーザーが既に存在');
    } else {
      // 作成ボタンを探す
      const createBtn = page.locator('button, a').filter({ hasText: /新規|作成|create|add|new/i }).first();
      if (await createBtn.count() > 0) {
        await createBtn.click();
        await page.waitForTimeout(2000);
        
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        if (await emailInput.count() > 0) {
          await emailInput.fill(SALES_EMAIL);
          const passInput = page.locator('input[type="password"], input[name="password"]').first();
          if (await passInput.count() > 0) await passInput.fill(SALES_PASS);
          
          const roleSelect = page.locator('select[name="role"], select').first();
          if (await roleSelect.count() > 0) await roleSelect.selectOption('SALES');
          
          const submitBtn = page.locator('button[type="submit"]').first();
          await submitBtn.click();
          await page.waitForTimeout(3000);
          
          const afterCreate = await page.textContent('body');
          console.log('作成後:', afterCreate.includes(SALES_EMAIL) ? 'ユーザーが表示' : '表示なし');
        }
      }
    }
    
    // Step 3: ログアウト
    console.log('\n=== Step 3: ログアウト ===');
    await context.clearCookies();
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('ログアウト後URL:', page.url());
    
    // Step 4: SALESでログイン
    console.log('\n=== Step 4: SALESログイン ===');
    await page.fill('input[type="email"]', SALES_EMAIL);
    await page.fill('input[type="password"]', SALES_PASS);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(8000);
    
    console.log('SALESログイン後URL:', page.url());
    
    const sessionResult = await page.evaluate(async () => {
      const r = await fetch('/api/auth/session');
      return await r.json();
    });
    console.log('セッション:', JSON.stringify(sessionResult));
    
    const errorMsg = await page.locator('p[style*="color: rgb(229, 62, 62)"], .error, [class*="error"]').textContent().catch(() => '');
    if (errorMsg) console.log('エラーメッセージ:', errorMsg);
    
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack?.split('\n').slice(0, 5).join('\n'));
  } finally {
    await browser.close();
  }
})();
