const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'lesson10_exercise.html');
if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  console.log('File length:', content.length);
  
  // Find where class="tab_container" starts
  const tabContainerIdx = content.indexOf('class="tab_container"');
  console.log('Index of class="tab_container":', tabContainerIdx);
  
  // Find where class="entry-content" starts
  const entryContentIdx = content.indexOf('class="entry-content"');
  console.log('Index of class="entry-content":', entryContentIdx);
  
  // Find where class="tab_content" starts
  const tabContentIdx = content.indexOf('class="tab_content"');
  console.log('Index of class="tab_content":', tabContentIdx);
} else {
  console.log('File not found!');
}
