/**
 * Adam v0.1 本番動作検証スクリプト（修正版）
 * 検証URL: https://adam-seven-gamma.vercel.app
 */
const { chromium } = require('@playwright/test');

const BASE_URL = 'https://adam-seven-gamma.vercel.app';
const MASTER_EMAIL = 'pedro.inoue@hb-jp.com';
const MASTER_PASS = 'ChangeMe123!';
const SALES_EMAIL = 'test-sales@example.com';
const SALES_PASS = 'TestPass123!';
const SALES_NAME = 'Test Sales User';

const results = [];

function log(item, status, detail = '') {
  const mark = status === 'OK' ? '✅ OK' : '❌ NG';
  const msg = `[${mark}] ${item}${detail ? ' | ' + detail : ''}`;
  console.log(msg);
  results.push({ item, status, detail });
}

async function waitForNavigation(page, urlPattern, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (page.url().includes(urlPattern)) return true;
    await page.waitForTimeout(300);
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // ---- (1) /login が表示される ----
    console.log('\n=== (1) /login 表示確認 ===');
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    const loginUrl = page.url();
    const hasLoginForm = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    if (loginUrl.includes('/login') && hasLoginForm) {
      log('(1) /login が表示される', 'OK', `URL: ${loginUrl}`);
    } else {
      log('(1) /login が表示される', 'NG', `URL: ${loginUrl}, form: ${hasLoginForm}`);
    }

    // ---- (2) MASTERでログイン → /dashboard/master へ遷移 ----
    console.log('\n=== (2) MASTERログイン → /dashboard/master ===');
    await page.fill('input[type="email"], input[name="email"]', MASTER_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', MASTER_PASS);
    await page.click('button[type="submit"]');
    
    const masterDashboard = await waitForNavigation(page, '/dashboard/master', 20000);
    const currentUrl2 = page.url();
    if (masterDashboard) {
      log('(2) MASTER → /dashboard/master 遷移', 'OK', `URL: ${currentUrl2}`);
    } else {
      log('(2) MASTER → /dashboard/master 遷移', 'NG', `URL: ${currentUrl2}`);
      await page.waitForTimeout(3000);
      console.log('  現在のURL:', page.url());
    }

    // ---- (3) /master/users で一覧表示 ----
    console.log('\n=== (3) /master/users 一覧表示 ===');
    await page.goto(BASE_URL + '/master/users', { waitUntil: 'networkidle', timeout: 30000 });
    const usersUrl = page.url();
    
    const hasTable = await page.locator('table, [data-testid="user-list"], ul li').count() > 0;
    const pageText = await page.textContent('body');
    const hasUserData = pageText.includes('@') || pageText.includes('user') || pageText.includes('Users') || pageText.includes('ユーザー');
    
    if (usersUrl.includes('/master/users') && (hasTable || hasUserData)) {
      log('(3) /master/users 一覧表示', 'OK', `URL: ${usersUrl}, table: ${hasTable}`);
    } else if (!usersUrl.includes('/master/users')) {
      log('(3) /master/users 一覧表示', 'NG', `リダイレクト先: ${usersUrl}`);
    } else {
      log('(3) /master/users 一覧表示', 'NG', `URL OK だが一覧なし. table: ${hasTable}, text: ${hasUserData}`);
    }

    // ---- (4) 新規ユーザー作成 ----
    console.log('\n=== (4) 新規ユーザー作成 ===');
    
    // 既存のテストユーザーを削除（クリーンな状態に）
    const existingRow = page.locator('tr').filter({ hasText: SALES_EMAIL });
    if (await existingRow.count() > 0) {
      console.log('  既存のテストユーザーを削除');
      const deleteBtn = existingRow.locator('button').filter({ hasText: /削除/ }).first();
      if (await deleteBtn.count() > 0) {
        page.once('dialog', dialog => dialog.accept());
        await deleteBtn.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // 作成ボタンをクリック
    const createBtn = page.locator('button').filter({ hasText: /新規ユーザー作成|新規/ }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      
      // 名前フィールド（type="text"）
      const nameInput = page.locator('input:not([type="email"]):not([type="password"]):not([type="submit"])').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill(SALES_NAME);
      }
      
      // メールアドレスフィールド
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.count() > 0) {
        await emailInput.fill(SALES_EMAIL);
      }
      
      // パスワードフィールド
      const passInput = page.locator('input[type="password"]').first();
      if (await passInput.count() > 0) {
        await passInput.fill(SALES_PASS);
      }
      
      // Roleセレクター
      const roleSelect = page.locator('select').first();
      if (await roleSelect.count() > 0) {
        await roleSelect.selectOption('SALES');
      }
      
      // 送信（フォーム内のsubmitボタン）
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(5000);
      
      const afterCreate = page.url();
      const bodyText2 = await page.textContent('body');
      const isSuccess = bodyText2.includes(SALES_EMAIL);
      
      if (isSuccess) {
        log('(4) 新規ユーザー作成 (SALES)', 'OK', `${SALES_EMAIL} 作成完了`);
      } else {
        const errorMsg = await page.locator('[style*="color: rgb(197"]').textContent().catch(() => '');
        log('(4) 新規ユーザー作成 (SALES)', 'NG', `成功確認できず. URL: ${afterCreate}, error: ${errorMsg}`);
      }
    } else {
      log('(4) 新規ユーザー作成 (SALES)', 'NG', '作成ボタンが見つからない');
    }

    // ---- (5) ログアウト → SALESでログイン → /dashboard/sales ----
    console.log('\n=== (5) ログアウト → SALESログイン → /dashboard/sales ===');
    
    // Cookieクリアでセッション終了
    await context.clearCookies();
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    // SALESでログイン
    const emailInputLogin = page.locator('input[type="email"]').first();
    const passInputLogin = page.locator('input[type="password"]').first();
    
    if (await emailInputLogin.count() > 0) {
      await emailInputLogin.fill(SALES_EMAIL);
      await passInputLogin.fill(SALES_PASS);
      await page.click('button[type="submit"]');
      
      const salesDashboard = await waitForNavigation(page, '/dashboard/sales', 20000);
      const currentUrl5 = page.url();
      
      if (salesDashboard) {
        log('(5) SALES → /dashboard/sales 遷移', 'OK', `URL: ${currentUrl5}`);
      } else if (currentUrl5.includes('/login')) {
        const errText = await page.locator('p').filter({ hasText: /パスワード|メール/ }).textContent().catch(() => '');
        log('(5) SALES → /dashboard/sales 遷移', 'NG', `ログイン失敗. URL: ${currentUrl5}. msg: ${errText}`);
      } else {
        log('(5) SALES → /dashboard/sales 遷移', 'NG', `予期しないURL: ${currentUrl5}`);
      }
    } else {
      log('(5) SALES → /dashboard/sales 遷移', 'NG', 'ログインフォームが見つからない');
    }

    // ---- (6) SALESで /master/users, /dashboard/master がブロックされる ----
    console.log('\n=== (6) SALES権限制御確認 ===');
    
    await page.goto(BASE_URL + '/master/users', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const masterUsersUrl = page.url();
    const isMasterUsersBlocked = !masterUsersUrl.includes('/master/users') || 
                                  masterUsersUrl.includes('/login') || 
                                  masterUsersUrl.includes('/403') ||
                                  masterUsersUrl.includes('/unauthorized');
    
    const bodyTextMU = await page.textContent('body');
    const hasBlockText = /403|forbidden|unauthorized|アクセス拒否|権限がありません/i.test(bodyTextMU);
    
    if (isMasterUsersBlocked || hasBlockText) {
      log('(6a) SALES: /master/users がブロック', 'OK', `リダイレクト先: ${masterUsersUrl}`);
    } else {
      log('(6a) SALES: /master/users がブロック', 'NG', `アクセス可能. URL: ${masterUsersUrl}`);
    }
    
    await page.goto(BASE_URL + '/dashboard/master', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const masterDashUrl = page.url();
    const isMasterDashBlocked = !masterDashUrl.includes('/dashboard/master') ||
                                  masterDashUrl.includes('/login') ||
                                  masterDashUrl.includes('/403') ||
                                  masterDashUrl.includes('/unauthorized');
    
    const bodyTextMD = await page.textContent('body');
    const hasBlockTextMD = /403|forbidden|unauthorized|アクセス拒否|権限がありません/i.test(bodyTextMD);
    
    if (isMasterDashBlocked || hasBlockTextMD) {
      log('(6b) SALES: /dashboard/master がブロック', 'OK', `リダイレクト先: ${masterDashUrl}`);
    } else {
      log('(6b) SALES: /dashboard/master がブロック', 'NG', `アクセス可能. URL: ${masterDashUrl}`);
    }

    // ---- (7) テストユーザー削除 ----
    console.log('\n=== (7) テストユーザー削除 ===');
    
    await context.clearCookies();
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 30000 });
    
    const emailInputDel = page.locator('input[type="email"]').first();
    if (await emailInputDel.count() > 0) {
      await emailInputDel.fill(MASTER_EMAIL);
      await page.locator('input[type="password"]').first().fill(MASTER_PASS);
      await page.click('button[type="submit"]');
      await waitForNavigation(page, '/dashboard/master', 20000);
      
      await page.goto(BASE_URL + '/master/users', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const salesUserRow = page.locator('tr').filter({ hasText: SALES_EMAIL }).first();
      if (await salesUserRow.count() > 0) {
        const deleteBtn = salesUserRow.locator('button').filter({ hasText: /削除/ }).first();
        if (await deleteBtn.count() > 0) {
          // Register dialog handler once (confirm dialog from window.confirm)
          page.once('dialog', dialog => dialog.accept());
          await deleteBtn.click();
          // Wait for React state update and page re-render
          await page.waitForTimeout(5000);
          // Reload page to get fresh server-side data
          await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
          
          const bodyAfterDel = await page.textContent('body');
          if (!bodyAfterDel.includes(SALES_EMAIL)) {
            log('(7) テストユーザー削除', 'OK', `${SALES_EMAIL} 削除完了`);
          } else {
            log('(7) テストユーザー削除', 'NG', 'ユーザーがまだ存在する可能性');
          }
        } else {
          log('(7) テストユーザー削除', 'NG', '削除ボタンが見つからない');
        }
      } else {
        const bodyText7 = await page.textContent('body');
        if (!bodyText7.includes(SALES_EMAIL)) {
          log('(7) テストユーザー削除', 'OK', 'ユーザーが一覧に存在しない（作成未完了 or 削除済み）');
        } else {
          log('(7) テストユーザー削除', 'NG', 'ユーザーは存在するが削除UIが見つからない');
        }
      }
    } else {
      log('(7) テストユーザー削除', 'NG', 'MASTERログインフォームが見つからない');
    }

  } catch (err) {
    console.error('スクリプトエラー:', err.message);
    console.error(err.stack?.split('\n').slice(0, 5).join('\n'));
  } finally {
    await browser.close();
  }

  // 結果サマリー
  console.log('\n========== 検証結果サマリー ==========');
  for (const r of results) {
    const mark = r.status === 'OK' ? '✅ OK' : '❌ NG';
    console.log(`[${mark}] ${r.item}`);
    if (r.detail) console.log(`       ${r.detail}`);
  }
  console.log('======================================');
  
  const total = results.length;
  const okCount = results.filter(r => r.status === 'OK').length;
  console.log(`\n結果: ${okCount}/${total} OK`);
  
  console.log('\n=== JSON ===');
  console.log(JSON.stringify(results, null, 2));
})();
