const fs = require('fs');
const html = fs.readFileSync('C:/Users/DELL/.gemini/antigravity/brain/769ee9be-3d23-457c-8396-c569a146673f/.system_generated/steps/6034/content.md', 'utf8');

const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');

const links = unescaped.match(/href="([^"]+)"/g) || [];
const unq = Array.from(new Set(links.map(l => l.replace('href="', '').replace('"', ''))));

console.log("Tất cả các liên kết hợp lệ:");
console.log(unq.filter(l => !l.includes('.css') && !l.includes('.js') && !l.includes('.woff2') && !l.includes('.png') && !l.includes('favicon.ico')));
