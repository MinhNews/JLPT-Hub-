const fs = require('fs');
const html = fs.readFileSync('E:/JLPT Hub/backend/src/scripts/listen_raw.html', 'utf8');
const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">({.*?})<\/script>/);
if (match) {
  const data = JSON.parse(match[1]);
  fs.writeFileSync('E:/JLPT Hub/backend/src/scripts/listen_data.json', JSON.stringify(data, null, 2));
  console.log("Extracted Next Data");
} else {
  console.log("Not found Next Data");
}
