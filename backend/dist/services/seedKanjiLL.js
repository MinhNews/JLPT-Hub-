"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = require("../models");
dotenv_1.default.config();
const seedKanjiLL = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jlpt_hub');
        console.log('MongoDB Connected');
        const dataPath = path_1.default.join(__dirname, '../../data/kanji_look_learn.json');
        const rawData = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf8'));
        // Delete all existing data to prevent duplicates
        await models_1.KanjiLL.deleteMany({});
        console.log('Cleared existing KanjiLL data');
        // Insert new data
        const inserted = await models_1.KanjiLL.insertMany(rawData);
        console.log(`Successfully seeded ${inserted.length} Kanji Look and Learn lessons`);
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};
seedKanjiLL();
