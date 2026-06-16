import mongoose from 'mongoose';
import { MinnaLesson } from '../models/MinnaLesson';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

function decrypt(enc: string): string {
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

function unescapeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&agrave;/g, 'à')
    .replace(/&atilde;/g, 'ã')
    .replace(/&iacute;/g, 'í')
    .replace(/&igrave;/g, 'ì')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&oacute;/g, 'ó')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&otilde;/g, 'õ')
    .replace(/&acirc;/g, 'â')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&yacute;/g, 'ý')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Agrave;/g, 'À')
    .replace(/&Itilde;/g, 'Ĩ')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Igrave;/g, 'Ì')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ugrave;/g, 'Ù')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Ograve;/g, 'Ò')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&Acirc;/g, 'Â')
    .replace(/&Ecirc;/g, 'Ê')
    .replace(/&Yacute;/g, 'Ý');
}

function stripTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanRuby(html: string): string {
  if (!html) return '';
  return html
    .replace(/<rt[^>]*>[\s\S]*?<\/rt>/gi, '')
    .replace(/<rp[^>]*>[\s\S]*?<\/rp>/gi, '');
}

function sanitize(content: string, maxLen = 120000): string {
  if (!content) return '';
  let cleaned = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/ on\w+="[^"]*"/gi, '');
  return cleaned.substring(0, maxLen);
}

function fetchUrl(url: string): Promise<string> {
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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Parse vocab table ─────────────────────────────────────────────────────────
function parseVocab(html: string): any[] {
  const vocab: any[] = [];
  const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  
  for (const row of rows) {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length < 4) continue;
    
    const cleaned = cells.map(c => stripTags(c).trim());
    let kana = '', kanji = '', hanViet = '', meaning = '';
    
    if (cleaned.length >= 5) {
      if (/^\d+$/.test(cleaned[0])) {
        kana = cleaned[1];
        kanji = cleaned[2];
        hanViet = cleaned[3];
        meaning = cleaned[4];
      } else {
        kana = cleaned[0];
        kanji = cleaned[1];
        hanViet = cleaned[2];
        meaning = cleaned[4];
      }
    } else if (cleaned.length === 4) {
      kana = cleaned[0];
      kanji = cleaned[1];
      hanViet = cleaned[2];
      meaning = cleaned[3];
    } else {
      continue;
    }
    
    if (!kana || ['Từ vựng', 'Kana', 'Hiragana', 'No', 'STT', ''].includes(kana)) continue;
    if (!meaning || ['Nghĩa', 'Meaning', 'Nghĩa tiếng Việt', ''].includes(meaning)) continue;
    if (kana.toUpperCase() === kana && kana.length < 5) continue;
    
    vocab.push({
      kana: unescapeHtml(kana).substring(0, 50),
      kanji: unescapeHtml(kanji).substring(0, 50),
      hanViet: unescapeHtml(hanViet).substring(0, 80),
      meaning: unescapeHtml(meaning).substring(0, 200),
      audioUrl: ''
    });
  }
  return vocab;
}

// ── Parse kanji table ─────────────────────────────────────────────────────────
function parseKanji(html: string): any[] {
  const kanjiList: any[] = [];
  const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  
  for (const row of rows) {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length < 2) continue;
    
    const cleaned = cells.map(c => stripTags(c).trim());
    let kanjiChar = '', hanViet = '', kana = '';
    
    if (cleaned.length >= 3) {
      kanjiChar = cleaned[0];
      hanViet = cleaned[1];
      kana = cleaned[2];
    } else if (cleaned.length === 2) {
      kanjiChar = cleaned[0];
      hanViet = cleaned[1];
    } else {
      continue;
    }
    
    if (!kanjiChar || ['Hán Tự', 'Kanji', ''].includes(kanjiChar)) continue;
    if (!hanViet || ['Âm Hán', 'Âm Hán Việt', ''].includes(hanViet)) continue;
    
    kanjiList.push({
      kanji: unescapeHtml(kanjiChar).substring(0, 30),
      hanViet: unescapeHtml(hanViet).substring(0, 60),
      kana: unescapeHtml(kana).substring(0, 30)
    });
  }
  return kanjiList;
}

// ── Parse grammar points ──────────────────────────────────────────────────────
function parseGrammar(html: string): any[] {
  const grammarPoints: any[] = [];
  const parts = html.split('<div class="slide">');
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const titleMatch = part.match(/<div class="slide-title">([\s\S]*?)<\/div>/);
    if (!titleMatch) continue;
    
    const title = unescapeHtml(stripTags(titleMatch[1]));
    if (title.includes('Hoàn thành') || title.includes('tương tự ví dụ') || title.includes('trên tranh') || title.includes('tranh')) {
      continue;
    }
    
    let explanation = '';
    const explanationMatch = part.match(/&Yacute; nghĩa[\s\S]*?<\/td>[\s\S]*?<\/tr>[\s\S]*?<tr>[\s\S]*?<td>([\s\S]*?)<\/td>/i)
      || part.match(/Giải thích[\s\S]*?<\/td>[\s\S]*?<\/tr>[\s\S]*?<tr>[\s\S]*?<td>([\s\S]*?)<\/td>/i)
      || part.match(/<span style="font-size: 12px">[\s\S]*?<strong>[\s\S]*?&Yacute; nghĩa<\/span>[\s\S]*?<\/tr>[\s\S]*?<tr>[\s\S]*?<td>([\s\S]*?)<\/td>/i);
    if (explanationMatch) {
      explanation = unescapeHtml(stripTags(explanationMatch[1]));
    }
    
    let structure = '';
    const structureMatch = part.match(/Cấu tr&uacute;c[\s\S]*?<\/tr>[\s\S]*?<tr>[\s\S]*?<td>([\s\S]*?)<\/td>/i);
    if (structureMatch) {
      structure = unescapeHtml(stripTags(structureMatch[1]));
    }
    
    const examples: any[] = [];
    const candichMatches = [...part.matchAll(/<div class="candich">([\s\S]*?)<\/div>[\s\S]*?<div class="nddich">([\s\S]*?)<\/div>/gi)];
    for (const m of candichMatches) {
      const jp = unescapeHtml(stripTags(cleanRuby(m[1])));
      const vi = unescapeHtml(stripTags(m[2]));
      if (jp && vi) {
        examples.push({ jp, vi });
      }
    }
    
    grammarPoints.push({
      title,
      structure,
      explanation: explanation || 'Xem chi tiết ở phần ví dụ.',
      examples: examples.slice(0, 6)
    });
  }
  return grammarPoints;
}

// ── Parse kaiwa dialogue ──────────────────────────────────────────────────────
function parseKaiwa(html: string): any {
  const lines: any[] = [];
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return { audioUrl: '', lines: [] };
  
  const tableHtml = tableMatch[1];
  const rows = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  let currentSpeaker = '';
  
  for (const row of rows) {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cells.length < 2) continue;
    
    let speaker = unescapeHtml(stripTags(cleanRuby(cells[0]))).replace(/[:：]/g, '').trim();
    if (speaker) {
      currentSpeaker = speaker;
    }
    
    const content = cells[1];
    const candichMatch = content.match(/<div class="candich">([\s\S]*?)<\/div>/i);
    const nddichMatch = content.match(/<div class="nddich">([\s\S]*?)<\/div>/i);
    
    if (candichMatch && nddichMatch) {
      const jp = unescapeHtml(stripTags(cleanRuby(candichMatch[1]))).trim();
      const vi = unescapeHtml(stripTags(nddichMatch[1])).trim();
      if (jp && vi) {
        lines.push({
          speaker: currentSpeaker || 'Người đối thoại',
          jp,
          vi
        });
      }
    }
  }
  
  let audioUrl = '';
  const audioMatch = html.match(/<audio[^>]*>[\s\S]*?<source[^>]*src="([^"]+)"/i)
    || html.match(/<audio[^>]*src="([^"]+)"/i);
  if (audioMatch) {
    audioUrl = audioMatch[1];
  }
  
  return { audioUrl, lines };
}

// ── Generate test questions dynamically from vocabulary list ──────────────────
function generateTest(vocabList: any[]): any[] {
  if (!vocabList || vocabList.length < 4) return [];
  const test: any[] = [];
  const count = Math.min(8, vocabList.length);
  const indices = Array.from({ length: vocabList.length }, (_, i) => i);
  
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  for (let i = 0; i < count; i++) {
    const item = vocabList[indices[i]];
    const choices: string[] = [item.meaning];
    
    const wrongPool = vocabList.filter(v => v.meaning !== item.meaning);
    for (let k = wrongPool.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [wrongPool[k], wrongPool[j]] = [wrongPool[j], wrongPool[k]];
    }
    
    for (let k = 0; k < Math.min(3, wrongPool.length); k++) {
      choices.push(wrongPool[k].meaning);
    }
    
    while (choices.length < 4) {
      choices.push(`Nghĩa khác ${choices.length}`);
    }
    
    const sortedChoices = [...choices];
    for (let k = sortedChoices.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [sortedChoices[k], sortedChoices[j]] = [sortedChoices[j], sortedChoices[k]];
    }
    
    const correctIdx = sortedChoices.indexOf(item.meaning);
    const question = item.kanji 
      ? `Ý nghĩa của từ "${item.kanji}" (${item.kana}) là gì?`
      : `Ý nghĩa của từ "${item.kana}" là gì?`;
      
    test.push({ question, choices: sortedChoices, correctIdx });
  }
  return test;
}

const BASE_URL = 'https://www.vnjpclub.com/minna-no-nihongo';

const urls = (n: number) => ({
  vocab: `${BASE_URL}/bai-${n}-tu-vung.html`,
  kanji: `${BASE_URL}/bai-${n}-han-tu.html`,
  grammar: `${BASE_URL}/bai-${n}-ngu-phap.html`,
  reading: `${BASE_URL}/bai-${n}-luyen-doc.html`,
  kaiwa: `${BASE_URL}/bai-${n}-hoi-thoai.html`,
  listening: `${BASE_URL}/bai-${n}-luyen-nghe.html`,
  exercise: `${BASE_URL}/bai-${n}-bai-tap.html`,
  kanjiRenshu: `https://www.vnjpclub.com/luyen-chu-han-bai-${n}.html`,
  readingComp: `${BASE_URL}/bai-${n}-25-bai-doc-hieu.html`,
  reference: `${BASE_URL}/bai-${n}-tham-khao.html`
});

async function main() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/jlpt_hub';
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('CONNECTED successfully!\n');
  
  for (let n = 1; n <= 50; n++) {
    console.log(`\n======================= BÀI ${n} =======================`);
    const lessonUrls = urls(n);
    const update: any = {};
    
    // 1. Fetch & Parse Vocab
    try {
      console.log(`[Bài ${n}] Fetching Vocab...`);
      const html = await fetchUrl(lessonUrls.vocab);
      const vocab = parseVocab(html);
      if (vocab.length > 0) {
        update.vocab = vocab;
        console.log(`  ✓ Found ${vocab.length} vocab words`);
        // Auto-generate test questions from vocab
        const test = generateTest(vocab);
        if (test.length > 0) {
          update.test = test;
          console.log(`  ✓ Generated ${test.length} test questions`);
        }
      }
    } catch (e: any) {
      console.error(`  ✗ Error parsing vocab for Lesson ${n}:`, e.message);
    }
    await sleep(400);

    // 2. Fetch & Parse Kanji
    try {
      console.log(`[Bài ${n}] Fetching Kanji...`);
      const html = await fetchUrl(lessonUrls.kanji);
      const kanji = parseKanji(html);
      if (kanji.length > 0) {
        update.kanji = kanji;
        console.log(`  ✓ Found ${kanji.length} kanji`);
      }
    } catch (e: any) {
      console.error(`  ✗ Error parsing kanji for Lesson ${n}:`, e.message);
    }
    await sleep(400);

    // 3. Fetch & Parse Grammar
    try {
      console.log(`[Bài ${n}] Fetching Grammar...`);
      const html = await fetchUrl(lessonUrls.grammar);
      const grammar = parseGrammar(html);
      if (grammar.length > 0) {
        update.grammar = grammar;
        console.log(`  ✓ Found ${grammar.length} grammar points`);
      }
    } catch (e: any) {
      console.error(`  ✗ Error parsing grammar for Lesson ${n}:`, e.message);
    }
    await sleep(400);

    // 4. Fetch & Parse Kaiwa
    try {
      console.log(`[Bài ${n}] Fetching Kaiwa...`);
      const html = await fetchUrl(lessonUrls.kaiwa);
      const kaiwa = parseKaiwa(html);
      if (kaiwa.lines && kaiwa.lines.length > 0) {
        update.kaiwa = kaiwa;
        console.log(`  ✓ Found ${kaiwa.lines.length} kaiwa lines`);
      }
    } catch (e: any) {
      console.error(`  ✗ Error parsing kaiwa for Lesson ${n}:`, e.message);
    }
    await sleep(400);

    // 5. Fetch HTML Sections
    const htmlFields: Record<string, string> = {
      readingHtml: lessonUrls.reading,
      listeningHtml: lessonUrls.listening,
      exerciseHtml: lessonUrls.exercise,
      kanjiRenshuHtml: lessonUrls.kanjiRenshu,
      readingCompHtml: lessonUrls.readingComp,
      referenceHtml: lessonUrls.reference
    };

    for (const [field, url] of Object.entries(htmlFields)) {
      try {
        console.log(`[Bài ${n}] Fetching ${field}...`);
        const html = await fetchUrl(url);
        if (html && html.length > 200) {
          update[field] = sanitize(html);
          console.log(`  ✓ Saved ${field} HTML (${html.length} chars)`);
        }
      } catch (e: any) {
        console.error(`  ✗ Error fetching ${field} for Lesson ${n}:`, e.message);
      }
      await sleep(350);
    }

    // Update database
    if (Object.keys(update).length > 0) {
      try {
        const result = await MinnaLesson.updateOne({ lessonNumber: n }, { $set: update });
        console.log(`  ✓ DB Update Status: Modified ${result.modifiedCount} document(s).`);
      } catch (e: any) {
        console.error(`  ✗ DB Error for Lesson ${n}:`, e.message);
      }
    } else {
      console.log(`  ⚠ No update data gathered for Lesson ${n}.`);
    }
  }

  console.log('\nMINNA DATA SCRAPING & SEEDING COMPLETED!');
  await mongoose.disconnect();
}

main().catch(console.error);
