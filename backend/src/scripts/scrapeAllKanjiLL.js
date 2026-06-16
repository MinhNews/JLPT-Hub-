const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runScraper() {
  console.log('Khởi động trình duyệt...');
  const browser = await puppeteer.launch({ headless: true });
  const allLessons = [];

  for (let i = 1; i <= 32; i++) {
    const url = `https://www.vnjpclub.com/kanji-look-and-learn/bai-${i}.html`;
    console.log(`Đang cào dữ liệu Bài ${i}...`);
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate and wait for DOM
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      const kanjis = await page.evaluate(() => {
        const results = [];
        const lines = document.querySelectorAll('.ka-left');
        lines.forEach(leftEl => {
          const kanjiChar = leftEl.querySelector('.ka-kanji')?.innerText?.trim();
          const hanViet = leftEl.querySelector('.ka-hv')?.innerText?.trim();
          
          let meaning = leftEl.querySelector('.ka-mean')?.innerText?.trim() || '';
          
          let onKun = [];
          const rows = leftEl.querySelectorAll('.ka-jp');
          rows.forEach(r => {
            if(r.innerText) onKun.push(r.innerText.trim());
          });
          
          let mnemonicText = '';
          let imgUrl = '';
          
          const rightEl = leftEl.nextElementSibling;
          if (rightEl && rightEl.classList.contains('ka-right')) {
            mnemonicText = rightEl.querySelector('.ka-vn')?.innerText?.trim() || '';
            const img = rightEl.querySelector('.ka-imgbox img');
            if (img) {
              imgUrl = img.getAttribute('src');
              if (imgUrl && imgUrl.startsWith('/')) {
                imgUrl = 'https://www.vnjpclub.com' + imgUrl;
              }
            }
          }
          
          if (kanjiChar) {
            results.push({
              kanji: kanjiChar,
              hanViet: hanViet || '',
              meaning: meaning,
              mnemonicText: mnemonicText,
              readings: onKun.join(' / '),
              imgUrl: imgUrl,
              examples: []
            });
          }
        });
        return results;
      });
      
      allLessons.push({
        lessonId: i,
        title: `Bài ${i}`,
        kanjis: kanjis
      });
      
      await page.close();
      
    } catch (err) {
      console.error(`Lỗi ở Bài ${i}:`, err.message);
    }
  }

  await browser.close();

  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'kanji_look_learn.json');
  fs.writeFileSync(outputPath, JSON.stringify(allLessons, null, 2));
  console.log(`Đã lưu thành công ${allLessons.length} bài học vào ${outputPath}!`);
}

runScraper();
