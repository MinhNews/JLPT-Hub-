const https = require('https');
https.get('https://jlpt-hub.vercel.app/kanjill', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Matches:', data.match(/https:\/\/[^\/"']+\.onrender\.com(\/api)?/g));
    console.log('Localhost:', data.match(/localhost:5000/g));
  });
});
