const mongoose = require('mongoose');
const https = require('https');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

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

// Decryption logic for VNJP Club data-ykhp
function decrypt(enc) {
  try {
    let d = enc
      .replace(/@/g, 'CAg')
      .replace(/!/g, 'W5')
      .replace(/\*/g, 'CAgI')
      .replace(/\$/g, 'dGhl')
      .replace(/%/g, 'YXN')
      .replace(/&/g, 'YW');
    const miss = d.length % 4;
    if (miss > 0) {
      d += '='.repeat(4 - miss);
    }
    return Buffer.from(d, 'base64').toString('utf-8');
  } catch (e) {
    return '';
  }
}

function unescapeHtml(html) {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Extract core article body from the raw HTML page
function extractCoreHtml(html) {
  if (!html) return '';
  
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

// Clean and sanitize the HTML to make it native to our project
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

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
        'Accept': 'text/html',
        'Accept-Language': 'vi-VN,vi;q=0.9'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const m = data.match(/data-ykhp="([^"]+)"/);
        if (m) {
          resolve(decrypt(unescapeHtml(m[1])));
        } else {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const BASE_URL = 'https://www.vnjpclub.com/minna-no-nihongo';

const specToUrl = (n, field) => {
  if (field === 'readingHtml') return `${BASE_URL}/bai-${n}-luyen-doc.html`;
  if (field === 'listeningHtml') return `${BASE_URL}/bai-${n}-luyen-nghe.html`;
  if (field === 'exerciseHtml') return `${BASE_URL}/bai-${n}-bai-tap.html`;
  if (field === 'readingCompHtml') return `${BASE_URL}/bai-${n}-25-bai-doc-hieu.html`;
  if (field === 'referenceHtml') return `${BASE_URL}/bai-${n}-tham-khao.html`;
  return '';
};

const badSpecs = [
  { n: 4, field: 'listeningHtml' },
  { n: 6, field: 'referenceHtml' },
  { n: 7, field: 'readingHtml' },
  { n: 9, field: 'readingHtml' },
  { n: 10, field: 'exerciseHtml' },
  { n: 11, field: 'readingHtml' },
  { n: 14, field: 'readingHtml' },
  { n: 17, fields: ['readingHtml', 'referenceHtml'] },
  { n: 18, field: 'referenceHtml' },
  { n: 20, field: 'readingHtml' },
  { n: 22, field: 'referenceHtml' },
  { n: 23, field: 'listeningHtml' },
  { n: 26, field: 'referenceHtml' },
  { n: 29, field: 'exerciseHtml' },
  { n: 33, field: 'readingCompHtml' },
  { n: 35, field: 'readingHtml' },
  { n: 41, field: 'listeningHtml' },
  { n: 44, field: 'readingHtml' },
  { n: 48, field: 'referenceHtml' },
  { n: 49, field: 'readingHtml' }
];

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('CONNECTED!');

  for (const spec of badSpecs) {
    const fields = spec.fields || [spec.field];
    for (const field of fields) {
      const url = specToUrl(spec.n, field);
      if (!url) continue;

      console.log(`Re-scraping Lesson ${spec.n} [${field}] from: ${url}`);
      try {
        const rawContent = await fetchUrl(url);
        if (rawContent && rawContent.length > 200) {
          const cleaned = cleanHtml(rawContent);
          
          await MinnaLesson.updateOne(
            { lessonNumber: spec.n },
            { $set: { [field]: cleaned } }
          );
          console.log(`  ✓ Successfully updated Lesson ${spec.n} [${field}]. Cleaned length: ${cleaned.length}`);
        } else {
          console.warn(`  ⚠ Empty or too short content returned for Lesson ${spec.n} [${field}]`);
        }
      } catch (err) {
        console.error(`  ✗ Error re-scraping Lesson ${spec.n} [${field}]:`, err.message);
      }
      await sleep(1500); // polite pause between requests to prevent VNJP block
    }
  }

  console.log('\nAll 20 lessons re-scraped and cleaned successfully!');
  await mongoose.disconnect();
}

run().catch(console.error);
