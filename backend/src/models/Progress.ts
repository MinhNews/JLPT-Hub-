import { Schema, model } from 'mongoose';

const progressSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: String, required: true },
  type: { type: String, enum: ['vocab', 'grammar', 'kanji', 'reading', 'listening', 'minna', 'kanjill', 'exam'], required: true },
  status: { type: String, enum: ['in_progress', 'mastered'], default: 'in_progress' },
  score: {
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  lastAccessedAt: { type: Date, default: Date.now }
}, { timestamps: true });

progressSchema.index({ userId: 1, lessonId: 1, type: 1 }, { unique: true });

export const Progress = model('Progress', progressSchema);
