const fs = require('fs');
const path = require('path');
const https = require('https');

const level = process.argv[2] || 'n5'; // default n5
const LEVEL_UPPER = level.toUpperCase();
const DATA_FILE = path.join(__dirname, `../../data/exams_${level}.json`);
const AUDIO_DIR = path.join(__dirname, `../../../../public/audio/${level}`); 

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

const delay = ms => new Promise(res => setTimeout(res, ms));

async function downloadAudio(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve(); 
    const reqUrl = url.replace(/ /g, '%20');
    const file = fs.createWriteStream(dest);
    https.get(reqUrl, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        return resolve();
      }
      response.pipe(file);
      file.on('finish', () => { file.close(() => resolve()); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      resolve();
    });
  });
}

function extractJSONData(html) {
  const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
  const qRegex = /\[\{"id":\d+,"mondai_id":\d+,"question_text".*?\}\]/g;
  let questions = [];
  let match;
  while ((match = qRegex.exec(unescaped)) !== null) {
    try {
      const arr = JSON.parse(match[0]);
      questions = questions.concat(arr);
    } catch(e) {}
  }
  let readingPassages = {};
  const rMatch = unescaped.match(/"readingPassages":(\{.*?\})/);
  if (rMatch) {
    try { readingPassages = JSON.parse(rMatch[1]); } catch(e) {}
  }
  return { questions, readingPassages };
}

async function scrapeExams() {
  const exams = [];
  const periods = [];
  for (let year = 2015; year <= 2025; year++) {
    periods.push(`${year}07`);
    periods.push(`${year}12`);
  }

  console.log(`Bắt đầu quét dữ liệu JLPT ${LEVEL_UPPER}...`);

  for (const ym of periods) {
    const year = parseInt(ym.substring(0, 4));
    const month = parseInt(ym.substring(4, 6));
    const examData = {
      id: ym, year: year, month: month,
      title: `JLPT ${LEVEL_UPPER} - Tháng ${month}/${year}`,
      vocabulary: null, grammar: null, listening: null
    };
    
    let hasData = false;
    for (const section of ['vocabulary', 'grammar_reading', 'listening']) {
      const url = `https://onjlpt.com/${LEVEL_UPPER}/${ym}/${section}`;
      console.log(`Đang tải: ${url}`);
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (res.status !== 200) continue;
        const html = await res.text();
        if (!html.includes('question_text')) continue;

        const data = extractJSONData(html);
        if (data.questions.length > 0) {
          hasData = true;
          if (section === 'listening') {
            for (let i = 0; i < data.questions.length; i++) {
              let q = data.questions[i];
              if (q.audio_url) {
                let audioUrl = q.audio_url;
                if (audioUrl.startsWith('/')) audioUrl = 'https://onjlpt.com' + audioUrl;
                const filename = `${ym}_${q.id}.mp3`;
                const dest = path.join(AUDIO_DIR, filename);
                await downloadAudio(audioUrl, dest);
                q.audio_url = `/audio/${level}/${filename}`;
              }
            }
          }
          examData[section] = data;
        }
      } catch (err) {}
      await delay(500);
    }
    if (hasData) {
      exams.push(examData);
      console.log(`[OK] Đã lưu xong kỳ thi ${examData.title}`);
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(exams, null, 2));
  }
  console.log(`HOÀN TẤT QUÉT ${LEVEL_UPPER}!`);
}

scrapeExams();
