"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = require("mongoose");
const subscriptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'CoursePlan', required: true },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
}, { timestamps: true });
exports.Subscription = (0, mongoose_1.model)('Subscription', subscriptionSchema);
