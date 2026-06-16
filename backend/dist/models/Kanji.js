"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kanji = void 0;
const mongoose_1 = require("mongoose");
const kanjiExampleSchema = new mongoose_1.Schema({
    word: { type: String, required: true },
    reading: { type: String, required: true },
    meaning: { type: String, required: true }
});
const kanjiSchema = new mongoose_1.Schema({
    kanji: { type: String, required: true, unique: true },
    reading: { type: String, required: true },
    meaning_hv: { type: String, default: '' },
    meaning_vn: { type: String, required: true },
    radical: { type: String, default: '' },
    mnemonic: { type: String, default: '' },
    vocab: { type: [kanjiExampleSchema], default: [] },
    lesson: { type: String, required: true },
    level: { type: String, default: 'N3' }
}, { timestamps: true });
exports.Kanji = (0, mongoose_1.model)('Kanji', kanjiSchema);
