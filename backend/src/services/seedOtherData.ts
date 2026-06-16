import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { Kanji } from '../models/Kanji';
import { Vocabulary } from '../models/Vocabulary';
import { Grammar } from '../models/Grammar';
import { ReadingLesson } from '../models/ReadingLesson';
import mongoose from 'mongoose';

dotenv.config();

const seedAllOtherData = async () => {
  try {
    await connectDB();

    const dataDir = path.join(__dirname, '../../../src/data');

    // 1. Seed Kanji
    console.log('\n--- Seeding Kanji N3 ---');
    await Kanji.deleteMany({});
    const kanjiDataPath = path.join(dataDir, 'enriched_kanji.json');
    if (fs.existsSync(kanjiDataPath)) {
      const rawKanji = fs.readFileSync(kanjiDataPath, 'utf8');
      const kanjiLessons = JSON.parse(rawKanji);
      let kanjiCount = 0;
      for (const lesson of kanjiLessons) {
        const lessonName = lesson.lesson; // e.g. "第1課"
        for (const card of lesson.cards) {
          const newKanji = new Kanji({
            ...card,
            lesson: lessonName
          });
          await newKanji.save();
          kanjiCount++;
        }
      }
      console.log(`Successfully seeded ${kanjiCount} Kanji cards.`);
    }

    // 2. Seed Grammar
    console.log('\n--- Seeding Grammar N3 ---');
    await Grammar.deleteMany({});
    const grammarDataPath = path.join(dataDir, 'mimikara_n3_grammar.json');
    if (fs.existsSync(grammarDataPath)) {
      const rawGrammar = fs.readFileSync(grammarDataPath, 'utf8');
      const grammarList = JSON.parse(rawGrammar);
      let grammarCount = 0;
      for (const item of grammarList) {
        const newGrammar = new Grammar(item);
        await newGrammar.save();
        grammarCount++;
      }
      console.log(`Successfully seeded ${grammarCount} Grammar patterns.`);
    }

    // 3. Seed Vocabulary
    console.log('\n--- Seeding Vocabulary N3 ---');
    await Vocabulary.deleteMany({});
    const vocabDataPath = path.join(dataDir, 'mimikara_n3_vocab.json');
    if (fs.existsSync(vocabDataPath)) {
      const rawVocab = fs.readFileSync(vocabDataPath, 'utf8');
      const vocabCategories = JSON.parse(rawVocab);
      let vocabCount = 0;
      for (const category in vocabCategories) {
        const sections = vocabCategories[category];
        for (const section in sections) {
          const list = sections[section];
          for (const item of list) {
            const newVocab = new Vocabulary({
              ...item,
              category,
              section
            });
            await newVocab.save();
            vocabCount++;
          }
        }
      }
      console.log(`Successfully seeded ${vocabCount} Vocabulary entries.`);
    }

    // 4. Seed Reading
    console.log('\n--- Seeding Reading N3 ---');
    await ReadingLesson.deleteMany({});
    const readingDataPath = path.join(dataDir, 'shinkanzen_n3_dokkai.json');
    if (fs.existsSync(readingDataPath)) {
      const rawReading = fs.readFileSync(readingDataPath, 'utf8');
      const readingLessons = JSON.parse(rawReading);
      let readingCount = 0;
      for (const lesson of readingLessons) {
        const newReading = new ReadingLesson(lesson);
        await newReading.save();
        readingCount++;
      }
      console.log(`Successfully seeded ${readingCount} Reading lessons.`);
    }

    console.log('\nAll other datasets seeded successfully!');
  } catch (error) {
    console.error('Error seeding other datasets:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
};

seedAllOtherData();
