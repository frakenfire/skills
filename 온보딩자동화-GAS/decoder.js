const fs = require('fs');
const skillContent = fs.readFileSync('C:\\Users\\P.CALM\\.antigravity\\skills\\환경-GAS스크립트배포할때\\SKILL.md', 'utf8');
const b64 = skillContent.split('```text')[1].split('```')[0].replace(/\s/g, '');
const jsonStr = Buffer.from(b64, 'base64').toString('utf8');

let fixed = jsonStr;
const match = fixed.match(/"private_key":\s*"([^"]+)"/);
if (match) {
  let pk = match[1].replace(/\n/g, '\\n').replace(/\r/g, '');
  fixed = fixed.substring(0, match.index) + '"private_key": "' + pk + '"' + fixed.substring(match.index + match[0].length);
}

fs.writeFileSync('service-account.json', fixed);
console.log('Decode success!');
