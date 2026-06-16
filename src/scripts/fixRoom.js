const fs = require('fs');
const path = 'src/app/exams/[level]/[examId]/[section]/page.js';
let content = fs.readFileSync(path, 'utf8');

// Replace CSS
content = content.replace("import '../exams.css';", "import '../../exams.css';");

// Replace useParams
content = content.replace("const { examId, section } = useParams();", "const { level, examId, section } = useParams();");

// Replace API fetch
content = content.replace("fetch(`http://localhost:5000/api/exams/n3/${examId}`)", "fetch(`http://localhost:5000/api/exams/${level}/${examId}`)");

// Replace any leftover n3 links
content = content.replace(/exams\/n3/g, "exams/${level}");

// Replace Timer
content = content.replace(
  "          if (section === 'listening') minutes = 40;\n          if (section === 'grammar') minutes = 70;",
  "          if (section === 'listening') minutes = level === 'n5' ? 30 : level === 'n4' ? 35 : 40;\n          if (section === 'grammar' || section === 'grammar_reading') minutes = (level === 'n5' || level === 'n4') ? 60 : 70;"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fix completed");
