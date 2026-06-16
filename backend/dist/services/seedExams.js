"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Exam_1 = require("../models/Exam");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const seedExams = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jlpt_hub');
        console.log('Connected to MongoDB');
        await Exam_1.Exam.deleteMany({});
        console.log('Cleared existing exams collection');
        const levels = ['n3', 'n4', 'n5'];
        for (const level of levels) {
            const filePath = path_1.default.join(__dirname, `../../data/exams_${level}.json`);
            if (fs_1.default.existsSync(filePath)) {
                const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
                const examsToInsert = data.map((exam) => ({
                    ...exam,
                    exam_id: exam.id,
                    level: level.toUpperCase()
                }));
                await Exam_1.Exam.insertMany(examsToInsert);
                console.log(`Seeded ${examsToInsert.length} exams for ${level.toUpperCase()}`);
            }
            else {
                console.log(`File not found: exams_${level}.json`);
            }
        }
        console.log('All exams seeded successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding exams:', error);
        process.exit(1);
    }
};
seedExams();
