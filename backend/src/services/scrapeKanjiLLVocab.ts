import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

const DATA_PATH = path.join(__dirname, '../../data/kanji_look_learn.json');

function getLessonUrl(lessonNum: number): string {
  return `https://www.vnjpclub.com/kanji-look-and-learn/bai-${lessonNum}.html`;
}

async function scrapeLessonWithPuppeteer(lessonNum: number, page: any) {
  const url = getLessonUrl(lessonNum);
  console.log(`Navigating to lesson ${lessonNum}: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    // Wait for the content to be decrypted by their JS
    await new Promise(r => setTimeout(r, 2000));
    
    const html = await page.content();
    const $ = cheerio.load(html);
    const kanjisData: any = {};
    
    const cards = $('.ka-card');
    if (cards.length > 0) {
        console.log(`Found ${cards.length} cards using .ka-card logic`);
        cards.each((_, card) => {
          const kanjiChar = $(card).find('.ka-kanji').text().trim();
          if (!kanjiChar) return;

          const examples: string[] = [];
          $(card).find('.ka-vocab-grid .col').each((_, col) => {
            const colHtml = $(col).html();
            if (colHtml) {
              const lines = colHtml.split(/<br\s*\/?>/i);
              for (const line of lines) {
                const text = cheerio.load(line).text().trim();
                if (text && text.includes(':')) {
                  const [word, meaning] = text.split(/\s*:\s*/);
                  const cleanWord = word.replace(/（/g, '(').replace(/）/g, ')');
                  examples.push(`${cleanWord}: ${meaning}`);
                }
              }
            }
          });
          kanjisData[kanjiChar] = examples;
        });
    } else {
       // Fallback for older layouts (maybe tables?)
       console.log('No .ka-card found, checking for tables...');
    }
    
    return kanjisData;
  } catch (error) {
    console.error(`Error scraping lesson ${lessonNum}:`, error);
    return {};
  }
}

async function main() {
  console.log('Reading database...');
  if (!fs.existsSync(DATA_PATH)) {
    console.error('Data file not found!');
    return;
  }
  
  const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
  const kanjiLookLearn = JSON.parse(rawData);
  
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  let updatedCount = 0;
  for (const lesson of kanjiLookLearn) {
    if (lesson.lessonId > 32) continue;
    
    console.log(`\n--- Processing Lesson ${lesson.lessonId} ---`);
    const scrapedData = await scrapeLessonWithPuppeteer(lesson.lessonId, page);
    
    for (const k of lesson.kanjis) {
      if (scrapedData[k.kanji] && scrapedData[k.kanji].length > 0) {
        k.examples = scrapedData[k.kanji];
        updatedCount++;
      }
    }
  }
  
  await browser.close();
  
  console.log(`\nDone! Updated ${updatedCount} kanjis with examples.`);
  fs.writeFileSync(DATA_PATH, JSON.stringify(kanjiLookLearn, null, 2), 'utf-8');
  console.log('Database saved successfully.');
}

main().catch(console.error);
