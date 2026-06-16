const puppeteer = require('puppeteer');
const fs = require('fs');

async function testScrape() {
  const url = 'https://www.vnjpclub.com/kanji-look-and-learn/bai-1.html';
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set user agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Get entire HTML after rendering
  const html = await page.content();
  fs.writeFileSync('test-puppeteer.html', html);
  console.log('Saved rendered HTML to test-puppeteer.html');
  
  // Let's try to extract kanji rows
  const kanjiData = await page.evaluate(() => {
    // We don't know the exact class yet, so we just return the text of the main content area
    // Let's try to find elements that contain "NHẤT", "NHỊ", etc.
    const entryContent = document.querySelector('.entry-content');
    if (entryContent) {
      return entryContent.innerHTML;
    }
    return '';
  });
  
  fs.writeFileSync('test-puppeteer-content.html', kanjiData);
  
  await browser.close();
  console.log('Done!');
}

testScrape();
