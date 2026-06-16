const fs = require('fs');
const html = fs.readFileSync('C:/Users/DELL/.gemini/antigravity/brain/769ee9be-3d23-457c-8396-c569a146673f/.system_generated/steps/6074/content.md', 'utf8');

const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');

console.log("Có chứa questions?", unescaped.includes('questions'));
console.log("Có chứa reading?", unescaped.includes('reading'));
console.log("Có chứa grammar?", unescaped.includes('grammar'));
console.log("Có chứa mondai_id?", unescaped.includes('mondai_id'));

// Print the index of 'questions' if it exists
let idx = unescaped.indexOf('questions');
if (idx !== -1) {
    console.log("Dữ liệu quanh questions:");
    console.log(unescaped.substring(idx - 100, idx + 500));
} else {
    idx = unescaped.indexOf('mondai');
    if (idx !== -1) {
        console.log("Dữ liệu quanh mondai:");
        console.log(unescaped.substring(idx - 100, idx + 500));
    }
}
