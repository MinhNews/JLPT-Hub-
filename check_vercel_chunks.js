const https = require('https');

https.get('https://jlpt-hub.vercel.app/kanjill', (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const jsFiles = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
    console.log(`Found ${jsFiles.length} JS files.`);
    jsFiles.forEach(file => {
      const url = file.startsWith('http') ? file : `https://jlpt-hub.vercel.app${file.startsWith('/') ? '' : '/'}${file}`;
      https.get(url, (jRes) => {
        let jsData = '';
        jRes.on('data', c => jsData += c);
        jRes.on('end', () => {
          if (jsData.includes('localhost:5000')) console.log('Found localhost:5000 in', file);
          if (jsData.includes('onrender.com')) {
            const match = jsData.match(/https:\/\/[^\/"']+\.onrender\.com[^"']*/g);
            console.log('Found onrender.com in', file, 'Value:', match);
          }
        });
      }).on('error', () => {});
    });
  });
});
