const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function scrapeLesson(lessonNumber) {
  const url = `https://www.vnjpclub.com/kanji-look-and-learn/bai-${lessonNumber}.html`;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const kanjis = [];
    
    // Using Cheerio to find elements by class
    $('.ka-kanji-line').each((i, el) => {
      const kanjiChar = $(el).find('.ka-kanji').text().trim();
      const hanViet = $(el).find('.ka-hv').text().trim();
      
      // Next sibling has the details
      const detailsContainer = $(el).next();
      const meaning = detailsContainer.find('.ka-mean').text().trim();
      const mnemonicText = detailsContainer.find('.ka-vn').text().trim();
      
      const onKun = [];
      detailsContainer.find('.ka-am-row .ka-val').each((j, row) => {
        onKun.push($(row).text().trim());
      });

      let imgUrl = detailsContainer.find('.ka-img img').attr('src');
      if (imgUrl && imgUrl.startsWith('/')) {
        imgUrl = 'https://www.vnjpclub.com' + imgUrl;
      }

      if (kanjiChar) {
        kanjis.push({
          kanji: kanjiChar,
          hanViet,
          meaning,
          mnemonicText,
          readings: onKun.join(' / '),
          imgUrl,
          examples: []
        });
      }
    });

    return kanjis;
  } catch (err) {
    console.error(`Failed to scrape lesson ${lessonNumber}:`, err.message);
    return [];
  }
}

async function runScraper() {
  const allLessons = [];
  
  // For the sake of demonstration and not spamming the site, we fetch Lesson 1 and 5.
  // The user can modify this loop from 1 to 32 to fetch everything.
  for (let i of [1, 5]) {
    console.log(`Scraping Lesson ${i}...`);
    const kanjis = await scrapeLesson(i);
    allLessons.push({
      lessonId: i,
      title: `Bài ${i}`,
      kanjis
    });
  }

  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(path.join(dataDir, 'kanji_look_learn.json'), JSON.stringify(allLessons, null, 2));
  console.log('Scraping completed. Data saved to data/kanji_look_learn.json');
}

runScraper();
