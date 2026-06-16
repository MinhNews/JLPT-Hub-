"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinnaLesson = void 0;
const mongoose_1 = require("mongoose");
const vocabItemSchema = new mongoose_1.Schema({
    kana: { type: String, required: true },
    kanji: { type: String, default: '' },
    hanViet: { type: String, default: '' },
    meaning: { type: String, required: true },
    audioUrl: { type: String, default: '' }
});
const exampleSchema = new mongoose_1.Schema({ jp: String, vi: String });
const grammarItemSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    structure: { type: String, default: '' },
    explanation: { type: String, default: '' },
    examples: [exampleSchema]
});
const kaiwaLineSchema = new mongoose_1.Schema({
    speaker: { type: String, default: '' },
    jp: { type: String, required: true },
    vi: { type: String, default: '' }
});
const listeningItemSchema = new mongoose_1.Schema({
    questionText: { type: String, default: '' },
    script: { type: String, default: '' },
    choices: [String],
    correctIdx: { type: Number, default: 0 }
});
const kanjiItemSchema = new mongoose_1.Schema({
    kanji: { type: String, required: true },
    hanViet: { type: String, default: '' },
    kana: { type: String, default: '' }
});
const testQuestionSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
    choices: [String],
    correctIdx: { type: Number, default: 0 }
});
const minnaLessonSchema = new mongoose_1.Schema({
    lessonNumber: { type: Number, required: true, unique: true },
    level: { type: String, enum: ['N5', 'N4'], required: true },
    titleJp: { type: String, required: true },
    titleVi: { type: String, default: '' },
    vocab: [vocabItemSchema],
    grammar: [grammarItemSchema],
    kaiwa: {
        audioUrl: { type: String, default: '' },
        lines: [kaiwaLineSchema]
    },
    listeningHtml: { type: String, default: '' },
    exerciseHtml: { type: String, default: '' },
    kanji: [kanjiItemSchema],
    kanjiRenshuHtml: { type: String, default: '' },
    readingHtml: { type: String, default: '' },
    readingCompHtml: { type: String, default: '' },
    test: [testQuestionSchema],
    referenceHtml: { type: String, default: '' }
}, { timestamps: true });
exports.MinnaLesson = (0, mongoose_1.model)('MinnaLesson', minnaLessonSchema);
