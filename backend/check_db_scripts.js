const mongoose = require('mongoose');

const MONGO_URI = "mongodb://admin_ecommerce:matkhau123@ac-4u2wvup-shard-00-00.qrkzavo.mongodb.net:27017,ac-4u2wvup-shard-00-01.qrkzavo.mongodb.net:27017,ac-4u2wvup-shard-00-02.qrkzavo.mongodb.net:27017/jlpt_hub_db?ssl=true&replicaSet=atlas-7x6ypv-shard-0&authSource=admin&retryWrites=true&w=majority";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const col = db.collection('minnalessons');
    
    const cursor = col.find({ kanjiRenshuHtml: { $exists: true } });
    let count = 0;
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc.kanjiRenshuHtml.includes('<script')) {
        console.log(`Lesson ${doc.lessonNumber} has script tag in kanjiRenshuHtml`);
        count++;
      }
    }
    console.log(`Checked. Total lessons with script: ${count}`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
