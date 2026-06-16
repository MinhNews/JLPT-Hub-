"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const MinnaLesson_1 = require("../models/MinnaLesson");
const dotenv_1 = __importDefault(require("dotenv"));
const https_1 = __importDefault(require("https"));
dotenv_1.default.config();
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
    }
    catch (e) {
        return '';
    }
}
function unescapeHtml(html) {
    if (!html)
        return '';
    return html
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ');
}
function stripTags(html) {
    if (!html)
        return '';
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function cleanRuby(html) {
    if (!html)
        return '';
    return html
        .replace(/<rt[^>]*>[\s\S]*?<\/rt>/gi, '')
        .replace(/<rp[^>]*>[\s\S]*?<\/rp>/gi, '');
}
function cleanGrammarHtml(html) {
    if (!html)
        return '';
    let cleaned = html;
    // Replace relative paths
    cleaned = cleaned.replace(/(src|href)="\/images\//gi, '$1="https://www.vnjpclub.com/images/');
    cleaned = cleaned.replace(/(src|href)='\/images\//gi, "$1='https://www.vnjpclub.com/images/");
    // Remove inline styles and classes
    cleaned = cleaned.replace(/ style="[^"]*"/gi, '');
    cleaned = cleaned.replace(/ style='[^']*'/gi, '');
    cleaned = cleaned.replace(/ class="[^"]*"/gi, '');
    cleaned = cleaned.replace(/ class='[^']*'/gi, '');
    // Remove empty paragraphs
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
    cleaned = cleaned.replace(/<p>&nbsp;<\/p>/gi, '');
    return cleaned.trim();
}
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https_1.default.get(url, {
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
                }
                else {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function parseGrammar(html) {
    const grammarPoints = [];
    const parts = html.split(/<div class="slide">/i);
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const titleMatch = part.match(/<div class="slide-title">([\s\S]*?)<\/div>/i);
        if (!titleMatch)
            continue;
        const title = unescapeHtml(stripTags(titleMatch[1]));
        if (title.includes('Hoàn thành') || title.includes('tương tự ví dụ') || title.includes('trên tranh') || title.includes('tranh')) {
            continue;
        }
        let structure = '';
        const rowMatch = part.match(/Cấu tr(?:&uacute;|ú)c[\s\S]*?<\/tr>\s*<tr[^>]*>([\s\S]*?)<\/tr>/i);
        if (rowMatch) {
            const tds = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
            if (tds.length >= 2) {
                structure = tds[1][1];
            }
            else if (tds.length === 1) {
                structure = tds[0][1];
            }
        }
        let explanation = '';
        const meaningRowMatch = part.match(/(?:Ý|&Yacute;) nghĩa[\s\S]*?<\/tr>\s*<tr[^>]*>([\s\S]*?)<\/tr>/i)
            || part.match(/Giải thích[\s\S]*?<\/tr>\s*<tr[^>]*>([\s\S]*?)<\/tr>/i);
        if (meaningRowMatch) {
            const tds = [...meaningRowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
            if (tds.length >= 2) {
                explanation = tds[1][1];
            }
            else if (tds.length === 1) {
                explanation = tds[0][1];
            }
        }
        const examples = [];
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
            structure: cleanGrammarHtml(structure) || '',
            explanation: cleanGrammarHtml(explanation) || 'Xem chi tiết ở phần ví dụ.',
            examples: examples.slice(0, 6)
        });
    }
    return grammarPoints;
}
async function main() {
    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://admin_ecommerce:matkhau123@ac-4u2wvup-shard-00-00.qrkzavo.mongodb.net/jlpt_hub_db';
    console.log('Connecting to MongoDB...');
    // Force strictQuery to avoid warnings
    mongoose_1.default.set('strictQuery', false);
    await mongoose_1.default.connect(MONGO_URI);
    console.log('CONNECTED successfully!\n');
    for (let n = 1; n <= 50; n++) {
        const url = `https://www.vnjpclub.com/minna-no-nihongo/bai-${n}-ngu-phap.html`;
        try {
            console.log(`[Bài ${n}] Fetching Grammar...`);
            const html = await fetchUrl(url);
            const grammar = parseGrammar(html);
            if (grammar.length > 0) {
                console.log(`  ✓ Found ${grammar.length} grammar points. Updating DB...`);
                await MinnaLesson_1.MinnaLesson.updateOne({ lessonNumber: n }, { $set: { grammar } });
            }
            else {
                console.log(`  ! No grammar points found for Lesson ${n}.`);
            }
        }
        catch (e) {
            console.error(`  ✗ Error Lesson ${n}:`, e.message);
        }
        await sleep(300);
    }
    console.log('\nAll grammar lessons re-scraped and updated!');
    process.exit(0);
}
main();
