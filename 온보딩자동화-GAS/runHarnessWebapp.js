const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

const keyPath = path.join(__dirname, 'service-account.json');
const url = 'https://script.google.com/macros/s/AKfycbwO6wvy44jCrBSw9S_FFW7fTAbOcKKKP3ujmQmVvPkMm_ecyIhlvlBUkWH2u2dJkDIxsw/exec';
const actionArg = process.argv[2] || 'runHarness';

const auth = new GoogleAuth({
  keyFile: keyPath,
  scopes: ['https://www.googleapis.com/auth/drive']
});

async function run() {
  console.log(`[ACTION] Authenticating for action: ${actionArg}...`);
  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    
    console.log('[HTTP] Sending Web App Request to Apps Script...');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.token}`
      },
      body: JSON.stringify({ action: actionArg })
    });
    
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
      console.log('================ FINAL RESULT ================');
      console.log(JSON.stringify(json, null, 2));
      console.log('==============================================');
      return json;
    } catch (e) {
      console.log('Raw output:', text);
      return { ok: false, error: 'JSON_PARSE_ERROR', raw: text };
    }
  } catch(err) {
    console.error('[ERROR]', err);
    return { ok: false, error: err.message };
  }
}

run();
