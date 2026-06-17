"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const ReadingLesson_1 = require("../models/ReadingLesson");
dotenv_1.default.config();
const run = async () => {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI is not defined');
    }
    const dataPath = path_1.default.join(__dirname, '../../../src/data/shinkanzen_n3_dokkai.json');
    const raw = fs_1.default.readFileSync(dataPath, 'utf8');
    const lessons = JSON.parse(raw);
    await mongoose_1.default.connect(mongoUri);
    console.log(`Connected to MongoDB: ${mongoose_1.default.connection.host}`);
    let matched = 0;
    let updated = 0;
    let missing = 0;
    for (const lesson of lessons) {
        const existing = await ReadingLesson_1.ReadingLesson.findOne({ id: String(lesson.id) });
        if (!existing) {
            missing++;
            await ReadingLesson_1.ReadingLesson.create(lesson);
            updated++;
            console.log(`Created missing reading lesson ${lesson.id}`);
            continue;
        }
        matched++;
        existing.set({
            title: lesson.title,
            part: lesson.part,
            passage: lesson.passage,
            sentenceTranslations: lesson.sentenceTranslations || [],
            questions: lesson.questions || [],
            explanation: lesson.explanation || existing.explanation || '',
            level: lesson.level || existing.level || 'N3',
        });
        await existing.save();
        updated++;
    }
    console.log(`Reading translations backfilled. matched=${matched}, created=${missing}, updated=${updated}`);
    await mongoose_1.default.disconnect();
};
run().catch(async (error) => {
    console.error(error);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
