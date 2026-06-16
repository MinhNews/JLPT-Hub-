const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'lesson10_exercise.html');
const content = fs.readFileSync(file, 'utf8');

// Find all matches of <div class="..." or similar
const matches = [...content.matchAll(/<div\s+class="([^"]+)"/gi)];
const classes = new Set(matches.map(m => m[1]));
console.log('Found classes:', [...classes].slice(0, 50));
