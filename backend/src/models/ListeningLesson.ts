import { Schema, model } from 'mongoose';

const questionSchema = new Schema({
  choices: { type: [String], required: true },
  correctAnswerIdx: { type: Number, required: true }
});

const blockSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  audioUrl: { type: String, required: true },
  questions: { type: [questionSchema], required: true },
  script: { type: String, default: '' },
  sentenceTranslations: [{
    jp: String,
    vi: String
  }]
});

const listeningLessonSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  part: { type: String, required: true },
  audioUrl: { type: String, default: '' },
  intro: { type: String, default: '' },
  blocks: { type: [blockSchema], default: [] },
  explanation: { type: String, default: '' },
  level: { type: String, default: 'N3' }
}, { timestamps: true });

export const ListeningLesson = model('ListeningLesson', listeningLessonSchema);
