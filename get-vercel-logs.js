/**
 * Vercel Function Logs を取得してエラーを確認
 */
const https = require('https');
const fs = require('fs');

const envContent = fs.readFileSync('.env.vercel.local', 'utf8');
const match = envContent.match(/VERCEL_OIDC_TOKEN="([^"]+)"/);
const oidcToken = match ? match[1] : null;

if (!oidcToken) { console.log('No OIDC token'); process.exit(1); }

const projectId = 'prj_SHMHovlhEYH9kNQ5wtDawbNPo7Qs';
const teamId = 'team_BKGUgDH3NTFbC4ihMXC814pT';

// Get latest deployment
const options = {
  hostname: 'api.vercel.com',
  path: `/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=1&target=production`,
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
      if (json.deployments && json.deployments.length > 0) {
        const dep = json.deployments[0];
        console.log('Latest deployment:', dep.uid, dep.url, dep.state);
        
        // Get logs
        const logOptions = {
          hostname: 'api.vercel.com',
          path: `/v2/deployments/${dep.uid}/events?teamId=${teamId}&limit=100`,
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + oidcToken,
          }
        };
        
        const logReq = https.request(logOptions, (logRes) => {
          let logData = '';
          logRes.on('data', chunk => logData += chunk);
          logRes.on('end', () => {
            console.log('Log status:', logRes.statusCode);
            try {
              // Each line is a JSON object
              const lines = logData.trim().split('\n');
              console.log('Total log lines:', lines.length);
              for (const line of lines.slice(-50)) {
                try {
                  const entry = JSON.parse(line);
                  if (entry.text && (entry.text.includes('error') || entry.text.includes('Error') || entry.text.includes('auth') || entry.text.includes('prisma'))) {
                    console.log(`[${entry.type}] ${entry.text}`);
                  }
                } catch(e) {}
              }
            } catch(e) {
              console.log('Raw logs:', logData.slice(0, 2000));
            }
          });
        });
        logReq.on('error', e => console.error(e));
        logReq.end();
      } else {
        console.log('Response:', JSON.stringify(json).slice(0, 500));
      }
    } catch(e) {
      console.log('Raw:', data.slice(0, 500));
    }
  });
});
req.on('error', e => console.error(e));
req.end();
