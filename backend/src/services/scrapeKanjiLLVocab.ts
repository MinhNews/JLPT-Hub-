import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const dataPath = path.join(__dirname, '../../data/kanji_look_learn.json');

async function scrape() {
  let kanjiData: any[] = [];
  if (fs.existsSync(dataPath)) {
    kanjiData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  for (let i = 1; i <= 32; i++) {
    console.log(`Scraping lesson ${i}...`);
    try {
      const { data } = await axios.get(`https://www.vnjpclub.com/kanji-look-and-learn/bai-${i}.html`);
      const $ = cheerio.load(data);
      
      const lessonEntry = kanjiData.find((l: any) => l.lessonId === i);
      if (!lessonEntry) continue;

      $('.ka-card').each((_, card) => {
        const kanjiChar = $(card).find('.ka-kanji').text().trim();
        
        const examples: string[] = [];
        $(card).find('.ka-vocab-grid .col').each((_, col) => {
          const html = $(col).html();
          if (html) {
            const lines = html.split(/<br\s*\/?>/i);
            for (const line of lines) {
              const text = cheerio.load(line).text().trim();
              // text looks like "見（み）る : Nhìn, xem"
              if (text && text.includes(':')) {
                const [word, meaning] = text.split(/\s*:\s*/);
                // Clean up any extra parentheses that vnjpclub might have added via <rp>
                const cleanWord = word.replace(/（/g, '(').replace(/）/g, ')');
                examples.push(`${cleanWord}: ${meaning}`);
              }
            }
          }
        });

        // Find this kanji in our database and update it
        const targetKanji = lessonEntry.kanjis.find((k: any) => k.kanji === kanjiChar);
        if (targetKanji) {
          targetKanji.examples = examples;
        }
      });
    } catch (err: any) {
      console.error(`Error scraping lesson ${i}:`, err.message);
    }
    // Wait 1s to not overload server
    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync(dataPath, JSON.stringify(kanjiData, null, 2), 'utf8');
  console.log('Successfully updated kanji_look_learn.json with vocabularies!');
}

scrape().catch(console.error);
