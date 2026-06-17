const axios = require('axios');
const cheerio = require('cheerio');

async function scrape() {
  const { data } = await axios.get('https://www.vnjpclub.com/kanji-look-and-learn/bai-6.html');
  const $ = cheerio.load(data);
  const encoded = $('.ykhp-protected-content').attr('data-ykhp');
  if (encoded) {
    let decodedHTML = Buffer.from(encoded, 'base64').toString('utf8');
    try {
       decodedHTML = decodeURIComponent(escape(Buffer.from(encoded, 'base64').toString('binary')));
    } catch (e) { }
    console.log('Decoded start:', decodedHTML.substring(0, 200));
    
    const $$ = cheerio.load(decodedHTML);
    console.log('Cards found:', $$('.ka-card').length);
  }
}
scrape();
