import { Schema, model } from 'mongoose';

const subscriptionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: Schema.Types.ObjectId, ref: 'CoursePlan', required: true },
  status: { type: String, enum: ['active', 'expired'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
}, { timestamps: true });

export const Subscription = model('Subscription', subscriptionSchema);
