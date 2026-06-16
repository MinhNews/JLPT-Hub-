const http = require('http');

http.get('http://localhost:5000/api/minna/lessons/27', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lesson = JSON.parse(data);
    console.log("=== READING HTML ===");
    console.log(lesson.readingHtml ? lesson.readingHtml.substring(0, 1000) : "N/A");
    console.log("\n=== LISTENING HTML ===");
    console.log(lesson.listeningHtml ? lesson.listeningHtml.substring(0, 1000) : "N/A");
    console.log("\n=== READING COMP HTML ===");
    console.log(lesson.readingCompHtml ? lesson.readingCompHtml.substring(0, 1000) : "N/A");
  });
}).on('error', (err) => console.log('Error: ' + err.message));
