"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grammar = void 0;
const mongoose_1 = require("mongoose");
const grammarSchema = new mongoose_1.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    meaning: { type: String, required: true },
    structure: { type: String, default: '' },
    explain: { type: String, default: '' },
    note: { type: String, default: '' },
    examples: [{
            jp: String,
            vi: String
        }],
    level: { type: String, default: 'N3' }
}, { timestamps: true });
exports.Grammar = (0, mongoose_1.model)('Grammar', grammarSchema);
