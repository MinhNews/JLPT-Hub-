const fs = require('fs');
const html = fs.readFileSync('C:/Users/DELL/.gemini/antigravity/brain/769ee9be-3d23-457c-8396-c569a146673f/.system_generated/steps/6074/content.md', 'utf8');

const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');

const apiLinks = unescaped.match(/https:\/\/[a-zA-Z0-9.\-_]+\/api\/[a-zA-Z0-9.\-_/]+/g) || [];
console.log("API Links:", Array.from(new Set(apiLinks)));

const endpoints = unescaped.match(/"\/api\/[a-zA-Z0-9.\-_/]+"/g) || [];
console.log("Endpoints:", Array.from(new Set(endpoints)));

// Let's also check for any text looking like a question
const texts = unescaped.match(/"([^"]{30,})"/g) || [];
console.log("Some long texts:");
console.log(texts.filter(t => t.includes('問題') || t.includes('答え') || /[ぁ-んァ-ヶ]/.test(t)).slice(0, 10));
