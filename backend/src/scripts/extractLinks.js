const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\DELL\\.gemini\\antigravity\\brain\\769ee9be-3d23-457c-8396-c569a146673f\\.system_generated\\steps\\6034\\content.md', 'utf8');

const links = html.match(/href="([^"]+)"/g) || [];
const uniqueLinks = new Set();

links.forEach(l => {
  if (l.includes('202507')) {
    uniqueLinks.add(l);
  }
});

console.log("Tìm thấy các đường dẫn sau:");
console.log(Array.from(uniqueLinks).join('\n'));
