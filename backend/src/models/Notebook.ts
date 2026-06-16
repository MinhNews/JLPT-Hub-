import { Schema, model } from 'mongoose';

const notebookSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['vocab', 'grammar', 'kanji', 'sentence', 'question', 'global'], required: true },
  originalId: { type: String, required: true },
  note: { type: String, default: '' },
}, { timestamps: true });

notebookSchema.index({ userId: 1, type: 1, originalId: 1 }, { unique: true });

export const Notebook = model('Notebook', notebookSchema);
