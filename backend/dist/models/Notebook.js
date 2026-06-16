"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notebook = void 0;
const mongoose_1 = require("mongoose");
const notebookSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['vocab', 'grammar', 'kanji', 'sentence', 'question', 'global'], required: true },
    originalId: { type: String, required: true },
    note: { type: String, default: '' },
}, { timestamps: true });
notebookSchema.index({ userId: 1, type: 1, originalId: 1 }, { unique: true });
exports.Notebook = (0, mongoose_1.model)('Notebook', notebookSchema);
