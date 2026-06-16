import { Schema, model } from 'mongoose';

const vocabExampleSchema = new Schema({
  japanese: { type: String, required: true },
  vietnamese: { type: String, required: true }
});

const vocabularySchema = new Schema({
  kanji: { type: String, required: true },
  reading: { type: String, required: true },
  hanviet: { type: String, default: '' },
  meaning: { type: String, required: true },
  examples: { type: [vocabExampleSchema], default: [] },
  category: { type: String, required: true },
  section: { type: String, required: true },
  level: { type: String, default: 'N3' }
}, { timestamps: true });

export const Vocabulary = model('Vocabulary', vocabularySchema);
