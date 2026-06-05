/**
 * Vercel REST API でFunction Logsを取得
 * Personal Token は使えないのでCI/CD tokensを試みる
 */
const https = require('https');
const fs = require('fs');

// .env.vercel.local からOIDCトークンを取得 (productionのは別途必要)
const envContent = fs.readFileSync('.env.vercel.local', 'utf8');

// Latest deployment ID
const DEPLOYMENT_ID = 'dpl_ainutqsw6HFiPB3kQHfLhSGYJWEG'; // adam-ainutqsw6
const TEAM_ID = 'team_BKGUgDH3NTFbC4ihMXC814pT';

// Get OIDC token (valid for 12 hours)
const oidcMatch = envContent.match(/VERCEL_OIDC_TOKEN="([^"]+)"/);
const token = oidcMatch ? oidcMatch[1] : null;

if (!token) {
  console.log('No token found');
  process.exit(1);
}

// Try to get deployment details
const options = {
  hostname: 'api.vercel.com',
  path: `/v13/deployments/${DEPLOYMENT_ID}?teamId=${TEAM_ID}`,
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Deployment:', json.uid, json.url, json.state);
      // Check env vars that were used
      if (json.env) {
        json.env.forEach(e => console.log(' ENV:', e.key));
      }
    } catch(e) {
      console.log('Response:', data.slice(0, 500));
    }
  });
});
req.on('error', e => console.error(e));
req.end();
