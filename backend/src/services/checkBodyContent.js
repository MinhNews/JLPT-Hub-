const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'lesson10_exercise.html');
const content = fs.readFileSync(file, 'utf8');

// Find all HTML tags (like <div, <table, <p) starting after index 75952
const bodyContent = content.substring(75952);
const tagMatches = [...bodyContent.matchAll(/<([a-z0-9]+)(\s+[^>]*)?>/gi)];
console.log('Total tags in body:', tagMatches.length);

console.log('First 50 tags in body:');
tagMatches.slice(0, 50).forEach((m, idx) => {
  const fullTag = m[0];
  const tagName = m[1];
  console.log(`${idx}: <${tagName} ...> (index in body: ${m.index})`);
  // If it's a div, table or main content tag, let's print a small snippet of it
  if (['div', 'p', 'table', 'img', 'audio'].includes(tagName.toLowerCase())) {
    console.log('   ', fullTag.substring(0, 150));
  }
});
