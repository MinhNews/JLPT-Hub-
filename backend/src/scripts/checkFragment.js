const fs = require('fs');
const html = fs.readFileSync('E:/JLPT Hub/backend/src/scripts/listen_raw.html', 'utf8');
const scripts = html.match(/<script.*?<\/script>/g);
const s = scripts[70];
const i = s.indexOf('mondai');
console.log(s.substring(i - 100, i + 300));
