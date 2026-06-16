const fs = require('fs');
const html = fs.readFileSync('E:/JLPT Hub/backend/src/scripts/listen_raw.html', 'utf8');
const scripts = html.match(/<script.*?<\/script>/g);
if (scripts) {
  scripts.forEach((s, i) => {
    if (s.includes('mondai') || s.includes('audio')) {
      console.log(`Script ${i}: length ${s.length}, mondai: ${s.includes('mondai')}, audio: ${s.includes('audio')}`);
      if (s.includes('mondais":')) {
        const match = s.match(/"mondais":(\[.*?\])/);
        if (match) {
            fs.writeFileSync('E:/JLPT Hub/backend/src/scripts/mondais.json', match[1]);
            console.log("Saved mondais.json!");
        }
      }
    }
  });
}
