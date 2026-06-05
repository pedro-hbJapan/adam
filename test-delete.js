/**
 * 削除フローのデバッグ
 */
const { chromium } = require('@playwright/test');

const BASE_URL = 'https://adam-seven-gamma.vercel.app';
const MASTER_EMAIL = 'pedro.inoue@hb-jp.com';
const MASTER_PASS = 'ChangeMe123!';
const SALES_EMAIL = 'test-sales@example.com';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // ダイアログイベントをログ
  page.on('dialog', async dialog => {
    console.log('Dialog type:', dialog.type(), 'message:', dialog.message());
    await dialog.accept();
    console.log('Dialog accepted');
  });

  try {
    // MASTERログイン
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.fill('input[type="email"]', MASTER_EMAIL);
    await page.fill('input[type="password"]', MASTER_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/master', { timeout: 15000 });
    console.log('MASTER logged in');
    
    // /master/usersに移動
    await page.goto(BASE_URL + '/master/users', { waitUntil: 'networkidle', timeout: 30000 });
    
    // test-sales@example.comを探す
    const salesRow = page.locator('tr').filter({ hasText: SALES_EMAIL });
    const count = await salesRow.count();
    console.log('Sales user rows found:', count);
    
    if (count > 0) {
      const bodyBefore = await page.textContent('body');
      console.log('Has SALES email before delete:', bodyBefore.includes(SALES_EMAIL));
      
      const deleteBtn = salesRow.locator('button').filter({ hasText: /削除/ }).first();
      const btnCount = await deleteBtn.count();
      console.log('Delete button count:', btnCount);
      
      if (btnCount > 0) {
        console.log('Clicking delete button...');
        await deleteBtn.click();
        console.log('Delete button clicked');
        
        // confirmダイアログを待つ
        await page.waitForTimeout(2000);
        console.log('After click, URL:', page.url());
        
        // ページリロードを待つ
        await page.waitForTimeout(5000);
        
        const bodyAfter = await page.textContent('body');
        console.log('Has SALES email after delete:', bodyAfter.includes(SALES_EMAIL));
        console.log('Current URL after delete:', page.url());
      }
    } else {
      console.log('SALES user not found in table');
      const body = await page.textContent('body');
      console.log('Body includes @:', body.includes('@'));
      console.log('Body snippet:', body.slice(0, 500));
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
