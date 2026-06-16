"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadingLesson = void 0;
const mongoose_1 = require("mongoose");
const readingQuestionSchema = new mongoose_1.Schema({
    questionJp: { type: String, default: '' },
    choices: { type: [String], required: true },
    correctAnswerIdx: { type: Number, required: true }
});
const readingLessonSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    part: { type: String, required: true },
    passage: { type: String, required: true },
    questions: { type: [readingQuestionSchema], required: true },
    explanation: { type: String, default: '' },
    level: { type: String, default: 'N3' }
}, { timestamps: true });
exports.ReadingLesson = (0, mongoose_1.model)('ReadingLesson', readingLessonSchema);
