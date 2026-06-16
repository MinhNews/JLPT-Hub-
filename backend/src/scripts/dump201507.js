const fs = require('fs');
fetch('https://onjlpt.com/N3/201507/listening').then(r => r.text()).then(html => {
  const scripts = html.match(/<script.*?<\/script>/g);
  if (scripts) {
    scripts.forEach((s, i) => {
      if (s.includes('mondai') || s.includes('audio')) {
        console.log(`Script ${i}: length ${s.length}`);
        if (s.length > 5000) {
          fs.writeFileSync('E:/JLPT Hub/backend/src/scripts/201507_listen.txt', s);
        }
      }
    });
  }
});
