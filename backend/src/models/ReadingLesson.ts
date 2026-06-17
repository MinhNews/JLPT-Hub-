import { Schema, model } from 'mongoose';

const readingQuestionSchema = new Schema({
  questionJp: { type: String, default: '' },
  choices: { type: [String], required: true },
  correctAnswerIdx: { type: Number, required: true }
});

const sentenceTranslationSchema = new Schema({
  jp: { type: String, default: '' },
  vi: { type: String, default: '' },
  japanese: { type: String, default: '' },
  vietnamese: { type: String, default: '' },
  text: { type: String, default: '' },
  translation: { type: String, default: '' },
  meaning: { type: String, default: '' }
}, { _id: false, strict: false });

const readingLessonSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  part: { type: String, required: true },
  passage: { type: String, required: true },
  questions: { type: [readingQuestionSchema], required: true },
  sentenceTranslations: { type: [sentenceTranslationSchema], default: [] },
  explanation: { type: String, default: '' },
  level: { type: String, default: 'N3' }
}, { timestamps: true, strict: false });

export const ReadingLesson = model('ReadingLesson', readingLessonSchema);
