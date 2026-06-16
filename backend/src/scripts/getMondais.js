const fs = require('fs');
const html = fs.readFileSync('E:/JLPT Hub/backend/src/scripts/listen_raw.html', 'utf8');
const match = html.match(/"mondaiList":(\[.*?\])/);
if (match) {
  // need to find where the array ends because regex might be greedy or not match properly if there are nested brackets
  let start = html.indexOf('"mondaiList":[');
  let end = html.indexOf('],"questions":[');
  if (start !== -1 && end !== -1) {
    const jsonStr = '{' + html.substring(start, end + 1) + '}';
    try {
      const parsed = JSON.parse(jsonStr);
      fs.writeFileSync('E:/JLPT Hub/backend/src/scripts/listen_mondais.json', JSON.stringify(parsed, null, 2));
      console.log("Saved.");
    } catch(e) { console.log(e); }
  }
}
