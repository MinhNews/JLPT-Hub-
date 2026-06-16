const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Khởi động trình duyệt giả lập...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Truy cập trang thi Từ Vựng N3 - Tháng 7/2025...');
  // Chú ý URL có thể có chữ in hoa hoặc chữ thường, thử /N3/202507/vocabulary
  await page.goto('https://onjlpt.com/N3/202507/vocabulary', { waitUntil: 'networkidle0', timeout: 60000 });
  
  // Đợi cho câu hỏi tải xong
  try {
    await page.waitForSelector('.flex.flex-col.gap-6', { timeout: 10000 });
  } catch(e) {
    console.log('Không tìm thấy container câu hỏi, có thể class name khác.');
  }

  const html = await page.evaluate(() => {
    return document.body.innerHTML;
  });

  fs.writeFileSync('test-exam-dom.html', html);
  console.log('Đã lưu cấu trúc DOM vào test-exam-dom.html');

  await browser.close();
})();
