const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_FILE = path.join(__dirname, '../../data/exams_n3.json');
const AUDIO_DIR = path.join(__dirname, '../../../../public/audio/n3'); // E:\JLPT Hub\public\audio\n3

// Ensure directories exist
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

const delay = ms => new Promise(res => setTimeout(res, ms));

async function downloadAudio(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve(); // Skip if exists
    
    // Convert url to handle spaces
    const reqUrl = url.replace(/ /g, '%20');
    
    const file = fs.createWriteStream(dest);
    https.get(reqUrl, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        return resolve(); // Resolve anyway to ignore missing audio
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      resolve();
    });
  });
}

function extractJSONData(html) {
  // Unescape string
  const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
  
  // Extract all questions
  const qRegex = /\[\{"id":\d+,"mondai_id":\d+,"question_text".*?\}\]/g;
  let questions = [];
  let match;
  while ((match = qRegex.exec(unescaped)) !== null) {
    try {
      const arr = JSON.parse(match[0]);
      questions = questions.concat(arr);
    } catch(e) {}
  }

  // Extract reading passages
  let readingPassages = {};
  const rMatch = unescaped.match(/"readingPassages":(\{.*?\})/);
  if (rMatch) {
    try {
      readingPassages = JSON.parse(rMatch[1]);
    } catch(e) {}
  }

  return { questions, readingPassages };
}

async function scrapeExams() {
  const exams = [];
  
  // Generate periods
  const periods = [];
  for (let year = 2015; year <= 2025; year++) {
    periods.push(`${year}07`);
    periods.push(`${year}12`);
  }

  console.log(`Bắt đầu quét ${periods.length} kỳ thi từ 2015 đến 2025...`);

  for (const ym of periods) {
    const year = parseInt(ym.substring(0, 4));
    const month = parseInt(ym.substring(4, 6));
    
    const examData = {
      id: ym,
      year: year,
      month: month,
      title: `JLPT N3 - Tháng ${month}/${year}`,
      vocabulary: null,
      grammar: null,
      listening: null
    };
    
    let hasData = false;

    for (const section of ['vocabulary', 'grammar_reading', 'listening']) {
      const url = `https://onjlpt.com/N3/${ym}/${section}`;
      console.log(`Đang tải: ${url}`);
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (res.status !== 200) {
          console.log(`-> Bỏ qua (Status: ${res.status})`);
          continue; // Exam section doesn't exist
        }
        
        const html = await res.text();
        if (!html.includes('question_text')) {
          console.log(`-> Bỏ qua (Không tìm thấy câu hỏi)`);
          continue;
        }

        const data = extractJSONData(html);
        if (data.questions.length > 0) {
          console.log(`-> Tìm thấy ${data.questions.length} câu hỏi phần ${section}.`);
          hasData = true;
          
          // Handle Audio for Listening
          if (section === 'listening') {
            for (let i = 0; i < data.questions.length; i++) {
              let q = data.questions[i];
              if (q.audio_url) {
                // Ensure audio URL is absolute
                let audioUrl = q.audio_url;
                if (audioUrl.startsWith('/')) {
                   audioUrl = 'https://onjlpt.com' + audioUrl;
                }
                const filename = `${ym}_${q.id}.mp3`;
                const dest = path.join(AUDIO_DIR, filename);
                console.log(`   + Đang tải file nghe: ${filename}`);
                await downloadAudio(audioUrl, dest);
                q.audio_url = `/audio/n3/${filename}`;
              }
            }
          }

          examData[section] = data;
        }
      } catch (err) {
        console.log(`-> Lỗi kết nối: ${err.message}`);
      }
      
      await delay(500); // Wait 0.5s between requests to be polite
    }

    if (hasData) {
      exams.push(examData);
      console.log(`[OK] Đã lưu xong kỳ thi ${examData.title}`);
    } else {
      console.log(`[SKIP] Không có dữ liệu cho kỳ thi ${examData.title}`);
    }
    
    // Save incrementally
    fs.writeFileSync(DATA_FILE, JSON.stringify(exams, null, 2));
  }
  
  console.log('HOÀN TẤT! Đã cào toàn bộ dữ liệu.');
}

scrapeExams();
