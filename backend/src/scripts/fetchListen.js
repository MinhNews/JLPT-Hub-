const fs = require('fs');
async function run() {
  const html = await fetch('https://onjlpt.com/N3/201607/listening').then(res => res.text());
  const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
  fs.writeFileSync('E:/JLPT Hub/backend/src/scripts/listen_raw.html', unescaped);
  console.log("Saved.");
}
run();
