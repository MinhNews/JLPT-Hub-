import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Exam } from '../models/Exam';
import dotenv from 'dotenv';
dotenv.config();

const seedExams = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jlpt_hub');
    console.log('Connected to MongoDB');

    await Exam.deleteMany({});
    console.log('Cleared existing exams collection');

    const levels = ['n3', 'n4', 'n5'];
    for (const level of levels) {
      const filePath = path.join(__dirname, `../../data/exams_${level}.json`);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const examsToInsert = data.map((exam: any) => ({
          ...exam,
          exam_id: exam.id,
          level: level.toUpperCase()
        }));
        await Exam.insertMany(examsToInsert);
        console.log(`Seeded ${examsToInsert.length} exams for ${level.toUpperCase()}`);
      } else {
        console.log(`File not found: exams_${level}.json`);
      }
    }

    console.log('All exams seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding exams:', error);
    process.exit(1);
  }
};

seedExams();
