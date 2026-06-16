const fs = require('fs');
const html = fs.readFileSync('E:/JLPT Hub/backend/src/scripts/listen_raw.html', 'utf8');
const i = html.indexOf('mondaiList":[');
let bracketCount = 0;
let j = i + 11;
while (j < html.length) {
  if (html[j] === '[') bracketCount++;
  if (html[j] === ']') {
    bracketCount--;
    if (bracketCount === 0) break;
  }
  j++;
}
console.log(html.substring(j, j+50));
