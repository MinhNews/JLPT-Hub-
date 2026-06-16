const fs = require('fs');
const path = require('path');
const https = require('https');

const delay = ms => new Promise(res => setTimeout(res, ms));

async function downloadAudio(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) return resolve();
    const reqUrl = url.replace(/ /g, '%20');
    https.get(reqUrl, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else {
        console.log(`Failed to download audio: ${reqUrl} (status: ${res.statusCode})`);
        resolve();
      }
    }).on('error', (err) => {
      console.log(`Error downloading audio: ${err.message}`);
      resolve();
    });
  });
}

async function patchExams(level) {
  const file = path.join(__dirname, `../../data/exams_${level}.json`);
  if (!fs.existsSync(file)) return;
  const exams = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  // Note: the frontend serves from JLPT Hub/public, but backend runs from backend/
  const AUDIO_DIR = path.join(__dirname, `../../../public/audio/${level}`);
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  for (let exam of exams) {
    if (!exam.listening) continue;
    // force re-patch if exists
    // if (exam.listening.mondais) continue;
    
    const ym = `${exam.year}${String(exam.month).padStart(2, '0')}`;
    const url = `https://onjlpt.com/${level.toUpperCase()}/${ym}/listening`;
    console.log(`Fetching ${url}`);
    
    try {
      const res = await fetch(url);
      const html = await res.text();
      const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\u003c/g, '<').replace(/\\u003e/g, '>');
      const i = unescaped.indexOf('"mondaiList":[');
      const j = unescaped.indexOf('],"questions":');
      if (i !== -1 && j !== -1) {
        const dataStr = unescaped.substring(i + 13, j + 1);
        const mondais = JSON.parse(dataStr);
        for (let m of mondais) {
          if (m.audio_url) {
            let audioUrl = m.audio_url;
            if (audioUrl.startsWith('/')) audioUrl = 'https://onjlpt.com' + audioUrl;
            const filename = `mondai_${level}_${ym}_${m.id}.mp3`;
            const dest = path.join(AUDIO_DIR, filename);
            await downloadAudio(audioUrl, dest);
            m.local_audio = `/audio/${level}/${filename}`;
          }
        }
        exam.listening.mondais = mondais;
        console.log(`Patched mondais for ${level} ${ym}`);
      }
    } catch (e) {
      console.log(`Error patching ${ym}: ${e.message}`);
    }
    await delay(1000);
  }
  
  fs.writeFileSync(file, JSON.stringify(exams, null, 2));
}

async function runAll() {
  await patchExams('n5');
  await patchExams('n4');
  await patchExams('n3');
  console.log("ALL PATCHED!");
}

runAll();
