"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Progress = void 0;
const mongoose_1 = require("mongoose");
const progressSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    lessonId: { type: String, required: true },
    type: { type: String, enum: ['vocab', 'grammar', 'kanji', 'reading', 'listening'], required: true },
    status: { type: String, enum: ['in_progress', 'mastered'], default: 'in_progress' },
    score: {
        correct: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    },
    lastAccessedAt: { type: Date, default: Date.now }
}, { timestamps: true });
progressSchema.index({ userId: 1, lessonId: 1, type: 1 }, { unique: true });
exports.Progress = (0, mongoose_1.model)('Progress', progressSchema);
