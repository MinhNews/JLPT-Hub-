import { Schema, model } from 'mongoose';

const grammarSchema = new Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  meaning: { type: String, required: true },
  structure: { type: String, default: '' },
  explain: { type: String, default: '' },
  note: { type: String, default: '' },
  examples: [{
    jp: String,
    vi: String
  }],
  level: { type: String, default: 'N3' }
}, { timestamps: true });

export const Grammar = model('Grammar', grammarSchema);
