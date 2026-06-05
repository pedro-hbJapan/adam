const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('.vercel/.env.development.local', 'utf8');
const match = envContent.match(/VERCEL_OIDC_TOKEN="([^"]+)"/);
const oidcToken = match ? match[1] : null;
const projectId = 'prj_SHMHovlhEYH9kNQ5wtDawbNPo7Qs';

if (!oidcToken) { console.log('No OIDC token'); process.exit(1); }

const options = {
  hostname: 'api.vercel.com',
  path: `/v9/projects/${projectId}/env`,
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + oidcToken,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      if (json.envs) {
        json.envs.forEach(env => {
          console.log(env.key, '| target:', JSON.stringify(env.target), '| type:', env.type);
        });
      } else {
        console.log('Response:', data.slice(0, 1000));
      }
    } catch(e) {
      console.log('Raw:', data.slice(0, 500));
    }
  });
});
req.on('error', e => console.error(e));
req.end();
