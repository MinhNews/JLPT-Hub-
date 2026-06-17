const https = require('https');
https.get('https://jlpt-hub.vercel.app/kanji', (res) => {
  let html = '';
  res.on('data', c => html += c);
  res.on('end', () => {
    const jsFiles = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
    console.log('Files:', jsFiles.length);
    jsFiles.forEach(file => {
      const url = file.startsWith('http') ? file : 'https://jlpt-hub.vercel.app' + (file.startsWith('/') ? '' : '/') + file;
      https.get(url, (jRes) => {
        let jsData = '';
        jRes.on('data', c => jsData += c);
        jRes.on('end', () => {
          if (jsData.includes('localhost:5000')) console.log('localhost:5000 found in', file);
          if (jsData.includes('onrender')) console.log('onrender found in', file);
        });
      }).on('error', () => {});
    });
  });
});
