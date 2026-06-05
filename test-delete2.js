/**
 * ユーザー削除テスト（test-sales@example.com と test-sales2@example.com）
 */
const { chromium } = require('@playwright/test');

const BASE_URL = 'https://adam-seven-gamma.vercel.app';
const MASTER_EMAIL = 'pedro.inoue@hb-jp.com';
const MASTER_PASS = 'ChangeMe123!';
const TARGET_EMAILS = ['test-sales@example.com', 'test-sales2@example.com'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.fill('input[type="email"]', MASTER_EMAIL);
    await page.fill('input[type="password"]', MASTER_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/master', { timeout: 15000 });
    console.log('MASTER logged in');
    
    await page.goto(BASE_URL + '/master/users', { waitUntil: 'networkidle', timeout: 30000 });
    
    // テーブルの全rowを確認
    const rows = await page.locator('tbody tr').all();
    console.log('Total rows:', rows.length);
    for (const row of rows) {
      const text = await row.textContent();
      console.log(' Row:', text.slice(0, 100));
    }
    
    // ターゲットユーザーを削除
    for (const email of TARGET_EMAILS) {
      const salesRow = page.locator('tr').filter({ hasText: email });
      const count = await salesRow.count();
      console.log('\nSearching for:', email, 'found:', count, 'rows');
      
      if (count > 0) {
        const deleteBtn = salesRow.first().locator('button:has-text("削除")');
        const btnCount = await deleteBtn.count();
        console.log('Delete button count:', btnCount);
        
        if (btnCount > 0) {
          // confirmダイアログをハンドル
          page.once('dialog', async dialog => {
            console.log('Dialog accepted:', dialog.message());
            await dialog.accept();
          });
          
          await deleteBtn.click();
          console.log('Delete clicked for:', email);
          await page.waitForTimeout(5000);
          
          const bodyText = await page.textContent('body');
          console.log('After delete, still has email:', bodyText.includes(email));
        }
      }
    }
    
    // 最終的なユーザー一覧
    console.log('\n=== Final user table ===');
    const finalRows = await page.locator('tbody tr').all();
    for (const row of finalRows) {
      const text = await row.textContent();
      console.log(' Row:', text.slice(0, 100));
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
