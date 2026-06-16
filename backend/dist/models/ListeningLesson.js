"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListeningLesson = void 0;
const mongoose_1 = require("mongoose");
const questionSchema = new mongoose_1.Schema({
    choices: { type: [String], required: true },
    correctAnswerIdx: { type: Number, required: true }
});
const blockSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    audioUrl: { type: String, required: true },
    questions: { type: [questionSchema], required: true },
    script: { type: String, default: '' },
    sentenceTranslations: [{
            jp: String,
            vi: String
        }]
});
const listeningLessonSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    part: { type: String, required: true },
    audioUrl: { type: String, default: '' },
    intro: { type: String, default: '' },
    blocks: { type: [blockSchema], default: [] },
    explanation: { type: String, default: '' },
    level: { type: String, default: 'N3' }
}, { timestamps: true });
exports.ListeningLesson = (0, mongoose_1.model)('ListeningLesson', listeningLessonSchema);
