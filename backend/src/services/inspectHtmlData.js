const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const minnaLessonSchema = new mongoose.Schema({
  lessonNumber: Number,
  readingHtml: String,
  listeningHtml: String,
  exerciseHtml: String,
  kanjiRenshuHtml: String,
  readingCompHtml: String,
  referenceHtml: String
});

const MinnaLesson = mongoose.model('MinnaLesson', minnaLessonSchema);

async function run() {
  const URI = process.env.MONGODB_URI;
  console.log('Connecting to', URI);
  await mongoose.connect(URI);
  console.log('Connected!');
  
  const lesson = await MinnaLesson.findOne({ lessonNumber: 1 });
  if (lesson) {
    console.log('Lesson 1 readingHtml length:', lesson.readingHtml ? lesson.readingHtml.length : 0);
    console.log('Lesson 1 listeningHtml length:', lesson.listeningHtml ? lesson.listeningHtml.length : 0);
    console.log('Lesson 1 exerciseHtml length:', lesson.exerciseHtml ? lesson.exerciseHtml.length : 0);
    
    // Save sample readingHtml to file
    if (lesson.readingHtml) {
      fs.writeFileSync(path.join(__dirname, 'sample_reading1.html'), lesson.readingHtml);
      console.log('Sample readingHtml written to E:/JLPT Hub/backend/src/services/sample_reading1.html');
    }
  } else {
    console.log('Lesson 1 not found!');
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
