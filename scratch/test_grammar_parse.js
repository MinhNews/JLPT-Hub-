const fs = require('fs');

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

const raw = fs.readFileSync('E:/JLPT Hub/scratch/lesson26_grammar_raw.html', 'utf8');
const match = raw.match(/data-ykhp="([^"]+)"/);
if (match) {
  const decrypted = decrypt(unescapeHtml(match[1]));
  const parts = decrypted.split('<div class="slide">');
  if (parts.length > 1) {
    console.log("=== FIRST GRAMMAR POINT ===");
    console.log(parts[1].substring(0, 1500));
  } else {
    console.log("No slides found in decrypted text.");
  }
} else {
  console.log("No data-ykhp found.");
}
