import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ReadingLesson } from '../models/ReadingLesson';

dotenv.config();

const run = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  const dataPath = path.join(__dirname, '../../../src/data/shinkanzen_n3_dokkai.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const lessons = JSON.parse(raw);

  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB: ${mongoose.connection.host}`);

  let matched = 0;
  let updated = 0;
  let missing = 0;

  for (const lesson of lessons) {
    const existing = await ReadingLesson.findOne({ id: String(lesson.id) });
    if (!existing) {
      missing++;
      await ReadingLesson.create(lesson);
      updated++;
      console.log(`Created missing reading lesson ${lesson.id}`);
      continue;
    }

    matched++;
    existing.set({
      title: lesson.title,
      part: lesson.part,
      passage: lesson.passage,
      sentenceTranslations: lesson.sentenceTranslations || [],
      questions: lesson.questions || [],
      explanation: lesson.explanation || existing.explanation || '',
      level: lesson.level || existing.level || 'N3',
    });
    await existing.save();
    updated++;
  }

  console.log(`Reading translations backfilled. matched=${matched}, created=${missing}, updated=${updated}`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
