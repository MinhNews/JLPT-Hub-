const fs = require('fs');

const text = fs.readFileSync('grammar_debug.txt', 'utf8');

// Find all keys in JSON strings roughly matching object structures
const keys = text.match(/"[a-zA-Z_]+"\s*:/g) || [];
const uniqueKeys = new Set(keys.map(k => k.replace(/"/g, '').replace(/:/g, '').trim()));

console.log("Các key tìm thấy trong JSON Ngữ pháp:");
console.log(Array.from(uniqueKeys).filter(k => k.length > 2 && k.length < 20).join(', '));
