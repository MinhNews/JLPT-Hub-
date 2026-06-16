const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://admin_ecommerce:matkhau123@ac-4u2wvup-shard-00-00.qrkzavo.mongodb.net/jlpt_hub_db';

async function main() {
  mongoose.set('strictQuery', false);
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const collection = db.collection('minnalessons');
  
  const lesson = await collection.findOne({ lessonNumber: 27 });
  if (lesson) {
    console.log("=== READING HTML ===");
    console.log(lesson.readingHtml.substring(0, 800));
    console.log("\n=== LISTENING HTML ===");
    console.log(lesson.listeningHtml.substring(0, 800));
    console.log("\n=== READING COMP HTML ===");
    console.log(lesson.readingCompHtml ? lesson.readingCompHtml.substring(0, 800) : "No reading comp HTML");
  }
  process.exit(0);
}

main();
