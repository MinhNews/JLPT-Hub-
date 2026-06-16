const fs = require('fs');
const html = fs.readFileSync('C:/Users/DELL/.gemini/antigravity/brain/769ee9be-3d23-457c-8396-c569a146673f/.system_generated/steps/6034/content.md', 'utf8');

const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');

console.log("vocabulary:", unescaped.includes('vocabulary'));
console.log("grammar:", unescaped.includes('grammar'));
console.log("reading:", unescaped.includes('reading'));

const idx = unescaped.indexOf('Ngữ pháp & Đọc hiểu');
if (idx !== -1) {
  console.log("Xung quanh Ngữ pháp:");
  console.log(unescaped.substring(idx - 150, idx + 150));
} else {
  console.log("Không tìm thấy cụm từ Ngữ pháp & Đọc hiểu");
}
