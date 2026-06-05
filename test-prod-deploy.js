const BASE_URL = 'https://adam-seven-gamma.vercel.app';

async function main() {
  // 1. CSRF check
  const csrfRes = await fetch(BASE_URL + '/api/auth/csrf');
  console.log('[1] /api/auth/csrf status:', csrfRes.status);
  const csrfData = await csrfRes.json();
  console.log('    csrfToken:', csrfData.csrfToken ? 'OK' : 'MISSING');

  // 2. Login as MASTER
  const csrfCookies = csrfRes.headers.get('set-cookie') || '';
  const loginBody = new URLSearchParams({
    email: 'master@example.com',
    password: 'ChangeMe123!',
    csrfToken: csrfData.csrfToken,
    callbackUrl: BASE_URL + '/dashboard/master'
  }).toString();

  const loginRes = await fetch(BASE_URL + '/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookies
    },
    body: loginBody,
    redirect: 'manual'
  });
  console.log('[2] Login status:', loginRes.status);

  // Collect session cookie
  const allCookies = [];
  const setCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [];
  setCookies.forEach(c => allCookies.push(c.split(';')[0]));
  // Also keep csrf cookies
  csrfCookies.split(',').forEach(c => {
    const trimmed = c.trim().split(';')[0];
    if (trimmed) allCookies.push(trimmed);
  });
  const cookieHeader = allCookies.join('; ');

  // 3. Check /api/products with session
  const prodRes = await fetch(BASE_URL + '/api/products', {
    headers: { 'Cookie': cookieHeader },
    redirect: 'manual'
  });
  console.log('[3] /api/products status:', prodRes.status);
  if (prodRes.status === 200) {
    const data = await prodRes.json();
    console.log('    products count:', data.length);
    if (data.length > 0) console.log('    first:', data[0].name);
  } else {
    const loc = prodRes.headers.get('location');
    console.log('    redirect:', loc);
  }

  // 4. Check /office/products access (should be allowed for MASTER)
  const officeRes = await fetch(BASE_URL + '/office/products', {
    headers: { 'Cookie': cookieHeader },
    redirect: 'manual'
  });
  console.log('[4] /office/products status:', officeRes.status);
  if (officeRes.status === 307 || officeRes.status === 302) {
    console.log('    redirect:', officeRes.headers.get('location'));
  }

  // 5. Check /warehouse/orders access (should be allowed for MASTER)
  const whRes = await fetch(BASE_URL + '/warehouse/orders', {
    headers: { 'Cookie': cookieHeader },
    redirect: 'manual'
  });
  console.log('[5] /warehouse/orders status:', whRes.status);
  if (whRes.status === 307 || whRes.status === 302) {
    console.log('    redirect:', whRes.headers.get('location'));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
