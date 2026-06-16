const fs = require('fs');
const html = fs.readFileSync('C:/Users/DELL/.gemini/antigravity/brain/769ee9be-3d23-457c-8396-c569a146673f/.system_generated/steps/6204/content.md', 'utf8');
const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');

let i = unescaped.indexOf('"id":110');
if (i !== -1) console.log(unescaped.substring(i, i+150));

i = unescaped.indexOf('"id":111');
if (i !== -1) console.log(unescaped.substring(i, i+150));
