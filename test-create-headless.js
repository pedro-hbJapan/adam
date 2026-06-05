const { chromium } = require('@playwright/test');

const BASE_URL = 'https://adam-seven-gamma.vercel.app';
const MASTER_EMAIL = 'pedro.inoue@hb-jp.com';
const MASTER_PASS = 'ChangeMe123!';
const SALES_EMAIL = 'test-sales2@example.com';
const SALES_PASS = 'TestPass123!';
const SALES_NAME = 'Test Sales User 2';

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
    
    await page.click('button:has-text("+ 新規ユーザー作成")');
    await page.waitForTimeout(1000);
    
    const inputs = await page.locator('form input').all();
    console.log('Form inputs found:', inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      console.log('  input['+i+'] type='+type);
    }
    
    // 名前フィールド (type=textがない、またはtype属性なし)
    await page.locator('form input').nth(0).fill(SALES_NAME);
    await page.locator('form input[type="email"]').fill(SALES_EMAIL);
    await page.locator('form input[type="password"]').fill(SALES_PASS);
    await page.locator('form select').selectOption('SALES');
    
    console.log('Form values set');
    
    // キャプチャ
    const respPromise = new Promise(resolve => {
      page.once('response', async resp => {
        if (resp.url().includes('/master/users')) {
          let body = '';
          try { body = await resp.text(); } catch(e) {}
          resolve({ status: resp.status(), url: resp.url(), body: body.slice(0, 100) });
        }
      });
    });
    
    await page.locator('form button[type="submit"]').click();
    console.log('Submit clicked');
    
    await page.waitForTimeout(8000);
    
    const bodyText = await page.textContent('body');
    console.log('Has '+SALES_EMAIL+':', bodyText.includes(SALES_EMAIL));
    
    // DBで確認
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    const users = await p.user.findMany();
    console.log('DB users:');
    users.forEach(u => console.log(' ', u.email, u.role));
    await p.$disconnect();
    
  } catch (err) {
    console.error('Error:', err.message, err.stack && err.stack.split('\n').slice(0,5).join('\n'));
  } finally {
    await browser.close();
  }
})();
