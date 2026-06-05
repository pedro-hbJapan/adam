const https = require('https');

const BASE_URL = 'https://adam-seven-gamma.vercel.app';

// まず CSRF トークンを取得してからログインを試みる
async function testLogin() {
  // Step 1: GET /api/auth/csrf でCSRFトークンを取得
  const csrfRes = await fetch(BASE_URL + '/api/auth/csrf');
  const csrfData = await csrfRes.json();
  console.log('CSRF token acquired:', csrfData.csrfToken ? 'YES' : 'NO');
  
  // Step 2: セッション確認
  const sessionRes = await fetch(BASE_URL + '/api/auth/session');
  const sessionData = await sessionRes.json();
  console.log('Session before login:', JSON.stringify(sessionData));
  
  // Step 3: POST でログイン (form-urlencoded)
  const cookies = csrfRes.headers.get('set-cookie') || '';
  console.log('CSRF cookies:', cookies.slice(0, 100));
  
  const loginBody = new URLSearchParams({
    email: 'pedro.inoue@hb-jp.com',
    password: 'ChangeMe123!',
    csrfToken: csrfData.csrfToken,
    callbackUrl: BASE_URL + '/'
  }).toString();
  
  const loginRes = await fetch(BASE_URL + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies,
      'Accept': 'application/json, text/html, */*'
    },
    body: loginBody,
    redirect: 'manual'
  });
  
  console.log('Login response status:', loginRes.status);
  console.log('Login response location:', loginRes.headers.get('location'));
  
  let responseBody = '';
  try { responseBody = await loginRes.text(); } catch(e) {}
  if (responseBody) console.log('Login response body:', responseBody.slice(0, 500));
}

// Node.js 18+ has native fetch
testLogin().catch(console.error);
