const fs = require('fs');
const html = fs.readFileSync('C:/Users/DELL/.gemini/antigravity/brain/769ee9be-3d23-457c-8396-c569a146673f/.system_generated/steps/6074/content.md', 'utf8');
const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
const mMatch = unescaped.match(/"mondais":(\[.*?\])/);
if (mMatch) console.log(mMatch[1].substring(0, 500));
