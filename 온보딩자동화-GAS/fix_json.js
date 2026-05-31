const fs = require('fs');
let s = fs.readFileSync('service-account.json', 'utf8');
let m = s.match(/"private_key":\s*"([^"]+)"/);
if (m) {
  let val = m[1].replace(/\n/g, '\\n').replace(/[\x00-\x09\x0B-\x1F]/g, '');
  s = s.substring(0, m.index) + '"private_key": "' + val + '"' + s.substring(m.index + m[0].length);
  fs.writeFileSync('service-account.json', s);
  console.log('JSON regex fixed completely');
}
