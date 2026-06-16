import { Schema, model } from 'mongoose';

const coursePlanSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  durationDays: { type: Number, required: true },
  features: { type: [String], default: [] },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

export const CoursePlan = model('CoursePlan', coursePlanSchema);
