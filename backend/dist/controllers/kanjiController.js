"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKanjiLessons = exports.getKanjiList = void 0;
const Kanji_1 = require("../models/Kanji");
const Progress_1 = require("../models/Progress");
const auth_1 = require("../utils/auth");
const getKanjiList = async (req, res) => {
    try {
        const { lesson, search } = req.query;
        const filter = {};
        if (lesson)
            filter.lesson = lesson;
        if (search) {
            const searchRegex = new RegExp(String(search), 'i');
            filter.$or = [
                { kanji: searchRegex },
                { reading: searchRegex },
                { meaning_vn: searchRegex },
                { meaning_hv: searchRegex }
            ];
        }
        // Sort by lesson string/number naturally or by creation
        const kanjiList = await Kanji_1.Kanji.find(filter).sort({ lesson: 1, kanji: 1 });
        const userId = (0, auth_1.getUserIdFromRequest)(req);
        let userProgress = [];
        if (userId) {
            userProgress = await Progress_1.Progress.find({ userId, type: 'kanji' });
        }
        const results = kanjiList.map(item => {
            const progress = userProgress.find(p => p.lessonId === String(item._id));
            return {
                ...item.toObject(),
                isCompleted: progress ? progress.status === 'mastered' : false
            };
        });
        res.status(200).json(results);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getKanjiList = getKanjiList;
const getKanjiLessons = async (req, res) => {
    try {
        const lessons = await Kanji_1.Kanji.distinct('lesson');
        // Sort lessons (e.g., 第1課, 第2課) numerically
        const sortedLessons = lessons.sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
        });
        res.status(200).json(sortedLessons);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getKanjiLessons = getKanjiLessons;
