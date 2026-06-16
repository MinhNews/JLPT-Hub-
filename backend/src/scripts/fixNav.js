const fs = require('fs');
let content = fs.readFileSync('src/components/LayoutClientWrapper.js', 'utf8');

content = content.replace(
  "    { name: 'Kanji Look & Learn', path: '/kanjill', icon: BookOpen },\n  ];\n\n  const n4NavItems",
  "    { name: 'Kanji Look & Learn', path: '/kanjill', icon: BookOpen },\n    { name: 'Luyện đề N5', path: '/exams/n5', icon: Edit3 },\n  ];\n\n  const n4NavItems"
);

content = content.replace(
  "    { name: 'Kanji Look & Learn', path: '/kanjill', icon: BookOpen },\n  ];\n\n  const levelNavMap",
  "    { name: 'Kanji Look & Learn', path: '/kanjill', icon: BookOpen },\n    { name: 'Luyện đề N4', path: '/exams/n4', icon: Edit3 },\n  ];\n\n  const levelNavMap"
);

fs.writeFileSync('src/components/LayoutClientWrapper.js', content, 'utf8');
