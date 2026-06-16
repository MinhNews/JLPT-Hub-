const fs = require('fs');
const html = fs.readFileSync('E:/JLPT Hub/backend/src/scripts/listen_raw.html', 'utf8');
const rMatch = html.match(/"readingPassages":(\{.*?\})/);
if (rMatch) {
  console.log("Reading passages length: ", rMatch[1].length);
}
const mMatch = html.match(/"mondais":(\[.*?\])/);
if (mMatch) {
  console.log("Mondais length: ", mMatch[1].length);
  console.log(mMatch[1].substring(0, 500));
}
