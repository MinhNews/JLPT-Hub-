const fs = require('fs');
const html = fs.readFileSync('E:/JLPT Hub/backend/src/scripts/listen_raw.html', 'utf8');
const i = html.indexOf('"mondaiList":[');
const j = html.indexOf('],"questions":[');
if (i !== -1 && j !== -1) {
  const data = html.substring(i + 13, j + 1);
  fs.writeFileSync('E:/JLPT Hub/backend/src/scripts/listen_mondais.json', data);
  console.log("Saved directly.");
} else {
  console.log("Not found markers");
}
