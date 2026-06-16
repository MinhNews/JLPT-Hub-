const fs = require('fs');
const html = fs.readFileSync('test-puppeteer-content.html', 'utf8');
const idx = html.indexOf('NHẤT');
console.log(html.substring(Math.max(0, idx - 200), idx + 1500));
