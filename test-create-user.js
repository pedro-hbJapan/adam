/**
 * createUserアクションを直接テスト（Playwriteで本番UIから）
 */
const { chromium } = require('@playwright/test');

const BASE_URL = 'https://adam-seven-gamma.vercel.app';
const MASTER_EMAIL = 'pedro.inoue@hb-jp.com';
const MASTER_PASS = 'ChangeMe123!';
const SALES_EMAIL = 'test-sales2@example.com';
const SALES_PASS = 'TestPass123!';
const SALES_NAME = 'Test Sales User 2';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 }); // headless:false でブラウザ表示
  const context = await browser.newContext();
  const page = await context.newPage();

  // APIレスポンスをキャプチャ
  page.on('response', async resp => {
    const url = resp.url();
    if (url.includes('/master/users') || url.includes('/api/')) {
      let body = '';
      try { body = await resp.text(); } catch(e) {}
      console.log(`<< ${resp.status()} ${url}`);
      if (body && body.length < 500 && !body.includes('<!DOCTYPE')) {
        console.log('   BODY:', body.slice(0, 300));
      }
    }
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
    console.log('Users page loaded');
    
    // 作成ボタンをクリック
    await page.click('button:has-text("+ 新規ユーザー作成")');
    await page.waitForTimeout(1000);
    
    // フォーム入力
    // 名前（type="text"ではないフィールド）
    const inputs = await page.locator('input').all();
    console.log('Input count in form:', inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const value = await inputs[i].inputValue();
      console.log(`  Input[${i}] type=${type} value="${value}"`);
    }
    
    // フォームを直接探して入力
    await page.locator('form input').nth(0).fill(SALES_NAME); // 名前
    await page.locator('form input[type="email"]').fill(SALES_EMAIL);
    await page.locator('form input[type="password"]').fill(SALES_PASS);
    await page.locator('form select').selectOption('SALES');
    
    console.log('Form filled');
    
    // 送信
    await page.locator('form button[type="submit"]').click();
    console.log('Submit clicked');
    
    // 結果を待つ
    await page.waitForTimeout(8000);
    
    const bodyText = await page.textContent('body');
    console.log('Has SALES email:', bodyText.includes(SALES_EMAIL));
    
    const successMsg = await page.locator('[style*="276749"]').textContent().catch(() => '');
    const errorMsg = await page.locator('[style*="c53030"]').textContent().catch(() => '');
    if (successMsg) console.log('Success:', successMsg);
    if (errorMsg) console.log('Error:', errorMsg);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
