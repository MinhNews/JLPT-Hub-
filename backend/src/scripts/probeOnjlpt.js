const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Intercept API calls to see where data comes from
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('.json')) {
      console.log('Intercepted API:', url);
    }
  });

  console.log('Navigating to N3 exams list...');
  await page.goto('https://onjlpt.com/n3', { waitUntil: 'networkidle2' });
  
  // Get the HTML of the main container to see structure
  const html = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
  console.log('HTML snippet:', html.substring(0, 500));

  await browser.close();
})();
