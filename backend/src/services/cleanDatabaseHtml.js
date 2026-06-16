const mongoose = require('mongoose');
require('dotenv').config();

const minnaLessonSchema = new mongoose.Schema({
  lessonNumber: Number,
  readingHtml: String,
  listeningHtml: String,
  exerciseHtml: String,
  kanjiRenshuHtml: String,
  readingCompHtml: String,
  referenceHtml: String
});

const MinnaLesson = mongoose.model('MinnaLesson', minnaLessonSchema);

function extractCoreHtml(html) {
  if (!html) return '';
  
  // If it's a full HTML page from VNJP Club, extract only the main article content
  if (html.includes('<div class="entry-content"') || html.includes('<div class="inside-article"') || html.includes('<main id="main"') || html.includes('<main class="site-main"')) {
    let startIdx = html.indexOf('<div class="entry-content" itemprop="text">');
    let startTagLen = '<div class="entry-content" itemprop="text">'.length;
    if (startIdx === -1) {
      startIdx = html.indexOf('<div class="entry-content">');
      startTagLen = '<div class="entry-content">'.length;
    }
    if (startIdx === -1) {
      startIdx = html.indexOf('<div class="inside-article">');
      startTagLen = '<div class="inside-article">'.length;
    }
    if (startIdx === -1) {
      startIdx = html.indexOf('<main class="site-main" id="main">');
      startTagLen = '<main class="site-main" id="main">'.length;
    }
    if (startIdx === -1) {
      startIdx = html.indexOf('<main id="main">');
      startTagLen = '<main id="main">'.length;
    }
    
    if (startIdx !== -1) {
      let endIdx = html.indexOf('</article>', startIdx);
      if (endIdx === -1) {
        endIdx = html.indexOf('<footer class="entry-meta">', startIdx);
      }
      if (endIdx === -1) {
        endIdx = html.indexOf('<div class="vnjp-link-grid"', startIdx);
      }
      
      if (endIdx !== -1) {
        return html.substring(startIdx + startTagLen, endIdx).trim();
      } else {
        return html.substring(startIdx + startTagLen).trim();
      }
    }
  }
  return html;
}

function cleanHtml(html) {
  if (!html) return '';

  let cleaned = extractCoreHtml(html);

  // 1. Strip all script, style, link stylesheet tags
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<link[^>]*>/gi, '');

  // 2. Strip ads and noscripts
  cleaned = cleaned.replace(/<div class="vnjp-ad-slot[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, '');
  cleaned = cleaned.replace(/<div class="vnjp-ad-slot[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<ins class="adsbygoogle"[^>]*>[\s\S]*?<\/ins>/gi, '');
  cleaned = cleaned.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');

  // 3. Strip vnjp-link-grid, essb social share links, and php blocks
  cleaned = cleaned.replace(/<div class="vnjp-link-grid">[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div class="essb[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div class="essb-pinterest-pro-content-marker"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<\?php[\s\S]*?\?>/gi, '');

  // 4. Handle lazyloaded images - copy data-src to src
  cleaned = cleaned.replace(/<img([^>]*?)src="[^"]*?"([^>]*?)data-src="([^"]*?)"([^>]*?)>/gi, (match, p1, p2, p3, p4) => {
    return `<img${p1}src="${p3}"${p2}data-src="${p3}"${p4}>`;
  });
  cleaned = cleaned.replace(/<img([^>]*?)data-src="([^"]*?)"([^>]*?)src="[^"]*?"([^>]*?)>/gi, (match, p1, p2, p3, p4) => {
    return `<img${p1}data-src="${p2}"src="${p2}"${p3}${p4}>`;
  });

  // 5. Prefix relative links for images and audio with VNJP Club domain
  cleaned = cleaned.replace(/(src|href)="\/Audio\//gi, '$1="https://www.vnjpclub.com/Audio/');
  cleaned = cleaned.replace(/(src|href)='\/Audio\//gi, "$1='https://www.vnjpclub.com/Audio/");
  cleaned = cleaned.replace(/(src|href)="\/images\//gi, '$1="https://www.vnjpclub.com/images/');
  cleaned = cleaned.replace(/(src|href)='\/images\//gi, "$1='https://www.vnjpclub.com/images/");
  cleaned = cleaned.replace(/(data-src)="\/images\//gi, '$1="https://www.vnjpclub.com/images/');
  cleaned = cleaned.replace(/(data-src)='\/images\//gi, "$1='https://www.vnjpclub.com/images/");

  // 6. Strip all inline styles to prevent dark-mode styling conflicts
  cleaned = cleaned.replace(/ style="[^"]*"/gi, '');
  cleaned = cleaned.replace(/ style='[^']*'/gi, '');

  // 7. Remove duplicate tab headers (H2 headers at the top of the scraped sections)
  cleaned = cleaned.replace(/<h2><a[^>]*>.*?<\/a><\/h2>/gi, '');
  cleaned = cleaned.replace(/<h2>.*?<\/h2>/gi, '');

  // 8. Remove metadata tag if present
  cleaned = cleaned.replace(/<meta http-equiv="Content-Type"[^>]*>/gi, '');

  // 9. Remove wrappers like <div class="tab_container"> or <div class="tab_content">
  // but keep their inner contents
  cleaned = cleaned.replace(/<div class="tab_container">/gi, '');
  cleaned = cleaned.replace(/<div class="tab_content"[^>]*>/gi, '');
  cleaned = cleaned.replace(/<a href="https:\/\/www\.vnjpclub\.com\/[^"]*"[^>]*>(.*?)<\/a>/gi, '<span>$1</span>');
  cleaned = cleaned.replace(/<a href="\/[^"]*"[^>]*>(.*?)<\/a>/gi, '<span>$1</span>');

  // 10. Clean up empty paragraphs or double brs
  cleaned = cleaned.replace(/<p>&nbsp;<\/p>/gi, '');
  cleaned = cleaned.replace(/<p><\/p>/gi, '');
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
  cleaned = cleaned.replace(/(&nbsp;)+/gi, ' ');
  cleaned = cleaned.replace(/<br \/>\s*<br \/>/gi, '<br />');

  return cleaned.trim();
}

async function run() {
  const URI = process.env.MONGODB_URI;
  console.log('Connecting to database...');
  await mongoose.connect(URI);
  console.log('CONNECTED!');

  const lessons = await MinnaLesson.find({});
  console.log(`Found ${lessons.length} lessons to clean.`);

  let count = 0;
  for (const lesson of lessons) {
    const update = {};
    let modified = false;

    const htmlFields = [
      'readingHtml',
      'listeningHtml',
      'exerciseHtml',
      'kanjiRenshuHtml',
      'readingCompHtml',
      'referenceHtml'
    ];

    for (const field of htmlFields) {
      if (lesson[field]) {
        const original = lesson[field];
        const cleaned = cleanHtml(original);
        if (original !== cleaned) {
          update[field] = cleaned;
          modified = true;
        }
      }
    }

    if (modified) {
      await MinnaLesson.updateOne({ _id: lesson._id }, { $set: update });
      count++;
      console.log(`  ✓ Cleaned Lesson ${lesson.lessonNumber}`);
    }
  }

  console.log(`\nSuccessfully cleaned ${count} lessons in the database.`);
  await mongoose.disconnect();
}

run().catch(console.error);
