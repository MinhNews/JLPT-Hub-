"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = require("mongoose");
const transactionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'CoursePlan', required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['bank_transfer', 'stripe', 'payos'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentProofUrl: { type: String, default: '' },
    transactionId: { type: String, default: '' },
}, { timestamps: true });
exports.Transaction = (0, mongoose_1.model)('Transaction', transactionSchema);
