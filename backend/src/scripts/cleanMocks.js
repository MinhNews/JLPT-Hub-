const fs = require('fs');
const path = require('path');

function filterMockTests(filename) {
  const fullPath = path.join('E:/JLPT Hub/backend/data', filename);
  if (fs.existsSync(fullPath)) {
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    
    // Only keep exams from 2025 (07 and 12)
    const filtered = data.filter(exam => exam.year === 2025 || exam.year === "2025");
    
    // Ensure only maximum 2 tests
    filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    const finalData = filtered.slice(0, 2);
    
    fs.writeFileSync(fullPath, JSON.stringify(finalData, null, 2));
    console.log(`Đã lọc xong ${filename}: Giữ lại ${finalData.length} đề thi.`);
  }
}

filterMockTests('exams_n4.json');
filterMockTests('exams_n5.json');
