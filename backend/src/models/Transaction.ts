import { Schema, model } from 'mongoose';

const transactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: Schema.Types.ObjectId, ref: 'CoursePlan', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['bank_transfer', 'stripe', 'payos'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentProofUrl: { type: String, default: '' },
  transactionId: { type: String, default: '' },
}, { timestamps: true });

export const Transaction = model('Transaction', transactionSchema);
