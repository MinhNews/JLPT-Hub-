const fs = require('fs');
const html = fs.readFileSync('C:/Users/DELL/.gemini/antigravity/brain/769ee9be-3d23-457c-8396-c569a146673f/.system_generated/steps/6204/content.md', 'utf8');
const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');

const links = unescaped.match(/href="([^"]+)"/g) || [];
const unq = Array.from(new Set(links.map(l => l.replace('href="', '').replace('"', ''))));

console.log("Liên kết N5:");
console.log(unq.filter(l => l.includes('N5') || l.includes('n5') || l.toLowerCase().includes('mock')));

const examBlocks = unescaped.match(/"id":\d+,"level_id":\d+,"year":\d+,"month":"[^"]+"/g) || [];
console.log("Exam blocks:", Array.from(new Set(examBlocks)));
