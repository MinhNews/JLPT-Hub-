const fs = require('fs');
const html = fs.readFileSync('test-raw.html', 'utf8');

// Unescape Next.js string serialization
const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');

// Regex to capture the questions array
const match = unescaped.match(/\[\{"id":\d+,"mondai_id":\d+,"question_text".*?\}\]/);
if (match) {
  try {
    const data = JSON.parse(match[0]);
    console.log("Thành công! Tìm thấy", data.length, "câu hỏi.");
    console.log(data[0]);
  } catch (e) {
    console.log("Lỗi parse JSON:", e.message);
  }
} else {
  console.log("Không tìm thấy mảng JSON.");
}
