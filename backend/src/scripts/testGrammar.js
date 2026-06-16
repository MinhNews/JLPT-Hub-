const https = require('https');
const fs = require('fs');

https.get('https://onjlpt.com/N3/202507/grammar', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // We just want to see how the questions are structured
    const unescaped = data.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
    // Let's find any JSON array that looks like questions
    const rMatch = unescaped.match(/\[\{"id":\d+,"mondai_id":\d+.*?\}\]/);
    if (rMatch) {
      console.log("Tìm thấy dạng câu hỏi! (có thể khác property name)");
      console.log(rMatch[0].substring(0, 500));
    } else {
      console.log("Không tìm thấy array nào có id và mondai_id.");
      // Let's print the next_data block
      const nextDataMatch = unescaped.match(/self\.__next_f\.push\(\[1,"(.*?)\]\)/);
      if (nextDataMatch) {
        fs.writeFileSync('grammar_debug.txt', unescaped);
        console.log("Đã lưu vào grammar_debug.txt");
      }
    }
  });
});
