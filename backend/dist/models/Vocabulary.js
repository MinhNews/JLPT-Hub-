"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vocabulary = void 0;
const mongoose_1 = require("mongoose");
const vocabExampleSchema = new mongoose_1.Schema({
    japanese: { type: String, required: true },
    vietnamese: { type: String, required: true }
});
const vocabularySchema = new mongoose_1.Schema({
    kanji: { type: String, required: true },
    reading: { type: String, required: true },
    hanviet: { type: String, default: '' },
    meaning: { type: String, required: true },
    examples: { type: [vocabExampleSchema], default: [] },
    category: { type: String, required: true },
    section: { type: String, required: true },
    level: { type: String, default: 'N3' }
}, { timestamps: true });
exports.Vocabulary = (0, mongoose_1.model)('Vocabulary', vocabularySchema);
