const axios = require('axios');
const cheerio = require('cheerio');

async function scrape() {
  const { data } = await axios.get('https://www.vnjpclub.com/kanji-look-and-learn/bai-5.html');
  const $ = cheerio.load(data);
  // Let's find the container of Kanji
  // Look at the image provided by the user. Each kanji is in a flexbox or table.
  // Since it's a blog post, it's likely just paragraphs or spans inside .entry-content
  let html = $('.entry-content').html() || $('.post-content').html() || $('article').html() || $('body').html();
  require('fs').writeFileSync('bai5_clean.html', html, 'utf8');
  console.log('Saved bai5_clean.html');
}
scrape();
