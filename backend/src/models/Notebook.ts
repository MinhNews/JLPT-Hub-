import { Schema, model } from 'mongoose';

const notebookSourceSchema = new Schema({
  module: { type: String, default: '' },
  label: { type: String, default: '' },
  path: { type: String, default: '' },
  lessonId: { type: String, default: '' },
  lessonTitle: { type: String, default: '' },
  itemId: { type: String, default: '' },
  questionId: { type: String, default: '' },
  japanese: { type: String, default: '' },
  translation: { type: String, default: '' },
  userAnswer: { type: String, default: '' },
  correctAnswer: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { _id: false, strict: false });

const notebookSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Ghi chú mới' },
  content: { type: String, default: '' },
  type: {
    type: String,
    enum: ['general', 'vocab', 'grammar', 'reading', 'listening', 'kanji', 'sentence', 'question', 'mistake', 'plan', 'global'],
    default: 'general',
    required: true
  },
  level: { type: String, enum: ['N5', 'N4', 'N3', 'N2', 'N1', 'ALL'], default: 'N3' },
  tags: { type: [String], default: [] },
  status: { type: String, enum: ['new', 'review', 'mastered'], default: 'new' },
  pinned: { type: Boolean, default: false },
  template: { type: String, default: 'blank' },
  source: { type: notebookSourceSchema, default: {} },
  blocks: { type: [Schema.Types.Mixed], default: [] },
  reviewAt: { type: Date, default: null },
  originalId: { type: String, required: true },
  note: { type: String, default: '' },
}, { timestamps: true });

notebookSchema.index({ userId: 1, type: 1, originalId: 1 }, { unique: true });
notebookSchema.index({ userId: 1, updatedAt: -1 });
notebookSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });
notebookSchema.index({ userId: 1, status: 1, type: 1 });

export const Notebook = model('Notebook', notebookSchema);
