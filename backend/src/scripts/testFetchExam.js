const fs = require('fs');

async function testFetch() {
  const res = await fetch('https://onjlpt.com/N3/202507/vocabulary', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  // Try to find the JSON array containing "question_text"
  const regex = /\[\{"id":\d+,"mondai_id":\d+,"question_text".*?\}\]/;
  const match = html.match(regex);
  if (match) {
    console.log('Match found! Length:', match[0].length);
    console.log(match[0].substring(0, 500));
  } else {
    // maybe it is escaped?
    const regex2 = /\\"\w+\\":\\".*?\\"/;
    if (html.match(regex2)) {
      console.log('Escaped JSON found');
      fs.writeFileSync('test-raw.html', html);
    } else {
      console.log('Not found');
    }
  }
}

testFetch();
