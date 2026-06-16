import { Schema, model } from 'mongoose';

const readingQuestionSchema = new Schema({
  questionJp: { type: String, default: '' },
  choices: { type: [String], required: true },
  correctAnswerIdx: { type: Number, required: true }
});

const readingLessonSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  part: { type: String, required: true },
  passage: { type: String, required: true },
  questions: { type: [readingQuestionSchema], required: true },
  explanation: { type: String, default: '' },
  level: { type: String, default: 'N3' }
}, { timestamps: true });

export const ReadingLesson = model('ReadingLesson', readingLessonSchema);
