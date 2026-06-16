"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLessonById = exports.getAllLessons = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const getAllLessons = (req, res) => {
    try {
        const dataPath = path_1.default.join(__dirname, '../../data/kanji_look_learn.json');
        if (!fs_1.default.existsSync(dataPath)) {
            return res.status(404).json({ message: 'Kanji Look and Learn data not found' });
        }
        const data = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf8'));
        // Only return summary to save bandwidth
        const summary = data.map((lesson) => ({
            lessonId: lesson.lessonId,
            title: lesson.title,
            kanjiCount: lesson.kanjis.length
        }));
        res.json(summary);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getAllLessons = getAllLessons;
const getLessonById = (req, res) => {
    try {
        const { id } = req.params;
        const dataPath = path_1.default.join(__dirname, '../../data/kanji_look_learn.json');
        if (!fs_1.default.existsSync(dataPath)) {
            return res.status(404).json({ message: 'Data not found' });
        }
        const data = JSON.parse(fs_1.default.readFileSync(dataPath, 'utf8'));
        const lesson = data.find((l) => l.lessonId.toString() === id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.json(lesson);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getLessonById = getLessonById;
