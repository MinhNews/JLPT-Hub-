"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursePlan = void 0;
const mongoose_1 = require("mongoose");
const coursePlanSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    features: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });
exports.CoursePlan = (0, mongoose_1.model)('CoursePlan', coursePlanSchema);
