/**
 * Verify post on Moltbook
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load vault
const vaultPath = path.resolve(__dirname, '../../../Grid-Private/auth/vault.json');
const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
const API_KEY = vault.moltbook.api_key;

const VERIFY_DATA = {
  verification_code: 'b009b64d26e1e24da677f787d660080877408e5860c4c510c8d6d8f437e15625',
  answer: '57.00'
};

const options = {
  hostname: 'www.moltbook.com',
  port: 443,
  path: '/api/v1/verify',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'SovereignSwarm/1.0'
  }
};

console.log('🚀 Verifying post on Moltbook...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`📨 Response Status: ${res.statusCode}`);
    console.log(`📨 Response Body: ${data}`);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Verification successful! Post published.');
    } else {
      console.error('❌ Verification failed.');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Network error:', error.message);
  process.exit(1);
});

req.write(JSON.stringify(VERIFY_DATA));
req.end();
