"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVocabCategories = exports.getVocabList = void 0;
const Vocabulary_1 = require("../models/Vocabulary");
const Progress_1 = require("../models/Progress");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getUserIdFromToken = (req) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return null;
    try {
        const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_for_jlpt_hub_321';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return decoded.id;
    }
    catch (err) {
        return null;
    }
};
const getVocabList = async (req, res) => {
    try {
        const { category, section, search } = req.query;
        const filter = {};
        if (category)
            filter.category = category;
        if (section)
            filter.section = section;
        if (search) {
            const searchRegex = new RegExp(String(search), 'i');
            filter.$or = [
                { kanji: searchRegex },
                { reading: searchRegex },
                { meaning: searchRegex },
                { hanviet: searchRegex }
            ];
        }
        const vocabList = await Vocabulary_1.Vocabulary.find(filter).sort({ kanji: 1 });
        // Optional user progress linking
        const userId = getUserIdFromToken(req);
        let userProgress = [];
        if (userId) {
            userProgress = await Progress_1.Progress.find({ userId, type: 'vocab' });
        }
        const results = vocabList.map(item => {
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
exports.getVocabList = getVocabList;
const getVocabCategories = async (req, res) => {
    try {
        // Group categories and sections
        const categories = await Vocabulary_1.Vocabulary.aggregate([
            {
                $group: {
                    _id: '$category',
                    sections: { $addToSet: '$section' }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        // Format structure: { [category]: string[] }
        const formatted = {};
        categories.forEach(item => {
            if (item._id) {
                formatted[item._id] = item.sections.sort();
            }
        });
        res.status(200).json(formatted);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getVocabCategories = getVocabCategories;
