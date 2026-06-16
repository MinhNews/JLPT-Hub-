import { Schema, model } from 'mongoose';

const kanjiExampleSchema = new Schema({
  word: { type: String, required: true },
  reading: { type: String, required: true },
  meaning: { type: String, required: true }
});

const kanjiSchema = new Schema({
  kanji: { type: String, required: true, unique: true },
  reading: { type: String, required: true },
  meaning_hv: { type: String, default: '' },
  meaning_vn: { type: String, required: true },
  radical: { type: String, default: '' },
  mnemonic: { type: String, default: '' },
  vocab: { type: [kanjiExampleSchema], default: [] },
  lesson: { type: String, required: true },
  level: { type: String, default: 'N3' }
}, { timestamps: true });

export const Kanji = model('Kanji', kanjiSchema);
