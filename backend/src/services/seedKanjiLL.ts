import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { KanjiLL } from '../models';

dotenv.config();

const seedKanjiLL = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jlpt_hub');
    console.log('MongoDB Connected');

    const dataPath = path.join(__dirname, '../../data/kanji_look_learn.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Delete all existing data to prevent duplicates
    await KanjiLL.deleteMany({});
    console.log('Cleared existing KanjiLL data');

    // Insert new data
    const inserted = await KanjiLL.insertMany(rawData);
    console.log(`Successfully seeded ${inserted.length} Kanji Look and Learn lessons`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedKanjiLL();
