const { google } = require('googleapis');
const path = require('path');

const keyPath = path.join(__dirname, 'service-account.json');
const spreadsheetId = '1dcrCO1bOQqFTjgYTO84i2mcrGbzyfKOmMlzVfIDs_Kg';

async function testSheetAccess() {
  console.log('Authenticating with service account...');
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  try {
    console.log('Fetching spreadsheet metadata...');
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    console.log('✅ Access SUCCESS!');
    console.log('Spreadsheet Title:', response.data.properties.title);
    console.log('Available Sheets:');
    response.data.sheets.forEach(sheet => {
      console.log(` - ${sheet.properties.title}`);
    });
  } catch (error) {
    console.error('❌ Access FAILED:');
    console.error(error.message);
  }
}

testSheetAccess();
