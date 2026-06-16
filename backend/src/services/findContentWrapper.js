const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'lesson10_exercise.html');
const content = fs.readFileSync(file, 'utf8');

// Try matching <main id="main"> ... </main>
const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
console.log('Main tag match:', mainMatch ? 'YES' : 'NO');

// Try matching <article[^>]*> ... </article>
const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
console.log('Article tag match:', articleMatch ? 'YES' : 'NO');

// Try matching <div class="...entry-content..."> ... </div>
const entryContentMatch = content.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/article>/i)
  || content.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*)/i);
console.log('Entry-content match:', entryContentMatch ? 'YES' : 'NO');

if (entryContentMatch) {
  console.log('Snippet of entry-content (first 300 chars):');
  console.log(entryContentMatch[1].substring(0, 300));
}
