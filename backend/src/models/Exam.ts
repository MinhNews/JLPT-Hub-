import { Schema, model } from 'mongoose';

const questionSchema = new Schema({
  id: { type: Number },
  mondai_id: { type: Number },
  question_text: { type: String },
  choices: { type: [String] },
  exam_id: { type: Number },
  section_id: { type: Number },
  correct_answer_index: { type: Number },
  score: { type: String },
  audio_url: { type: String },
  image_url: { type: String },
  passage_id: { type: Number }
});

const mondaiSchema = new Schema({
  id: { type: Number },
  mondai_number: { type: Number },
  title: { type: String },
  audio_url: { type: String },
});

const readingPassageSchema = new Schema({
  id: { type: Number },
  content: { type: String }
});

const sectionSchema = new Schema({
  questions: { type: [questionSchema] },
  mondais: { type: [mondaiSchema] },
  readingPassages: { type: [readingPassageSchema] }
});

const examSchema = new Schema({
  exam_id: { type: String, required: true },
  level: { type: String, required: true },
  year: { type: Number },
  month: { type: Number },
  title: { type: String },
  vocabulary: sectionSchema,
  grammar: sectionSchema,
  grammar_reading: sectionSchema,
  listening: sectionSchema
}, { timestamps: true });

export const Exam = model('Exam', examSchema);
