const fs = require('fs');
const html = fs.readFileSync('C:/Users/DELL/.gemini/antigravity/brain/769ee9be-3d23-457c-8396-c569a146673f/.system_generated/steps/6074/content.md', 'utf8');
const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');

const matchJSON = unescaped.match(/\[\{.*?\}\]/g) || [];
let found = false;
matchJSON.forEach(m => {
  if (m.length > 1000) {
    console.log("Tìm thấy JSON có độ dài:", m.length);
    console.log(m.substring(0, 500));
    found = true;
  }
});

if (!found) {
    const keys = unescaped.match(/"[A-Za-z0-9_]+"\s*:/g) || [];
    const uniqueKeys = new Set(keys.map(k => k.replace(/"/g, '').replace(/:/g, '').trim()));
    console.log("Các khóa tìm thấy:");
    console.log(Array.from(uniqueKeys).filter(k => k.length > 2 && k.length < 20).join(', '));
}
