const fs = require('fs');
const html = fs.readFileSync('E:/JLPT Hub/backend/src/scripts/listen_raw.html', 'utf8');
const i = html.indexOf('"questions":[');
console.log(html.substring(i - 200, i + 200));
