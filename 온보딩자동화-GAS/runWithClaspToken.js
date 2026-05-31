const fs = require('fs');
const os = require('os');
const path = require('path');

const claspRcPath = path.join(os.homedir(), '.clasprc.json');
const claspRc = JSON.parse(fs.readFileSync(claspRcPath, 'utf8'));

const token = claspRc.tokens.default.access_token;
const url = 'https://script.google.com/macros/s/AKfycbwO6wvy44jCrBSw9S_FFW7fTAbOcKKKP3ujmQmVvPkMm_ecyIhlvlBUkWH2u2dJkDIxsw/exec';
const actionArg = process.argv[2] || 'installTriggers';

async function run() {
  console.log('[ACTION] Authenticating with ~/.clasprc.json token...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: actionArg })
    });
    
    const text = await res.text();
    console.log('================ FINAL RESULT ================');
    console.log(text);
    console.log('==============================================');
  } catch(err) {
    console.error('[ERROR]', err);
  }
}
run();
