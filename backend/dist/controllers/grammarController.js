"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGrammarQuestions = exports.getGrammarById = exports.getGrammarList = void 0;
const Grammar_1 = require("../models/Grammar");
const GrammarQuiz_1 = require("../models/GrammarQuiz");
const Progress_1 = require("../models/Progress");
const auth_1 = require("../utils/auth");
const getGrammarList = async (req, res) => {
    try {
        const { search } = req.query;
        const filter = {};
        if (search) {
            const searchRegex = new RegExp(String(search), 'i');
            filter.$or = [
                { title: searchRegex },
                { meaning: searchRegex },
                { explain: searchRegex }
            ];
        }
        const grammarList = await Grammar_1.Grammar.find(filter).sort({ id: 1 });
        const userId = (0, auth_1.getUserIdFromRequest)(req);
        let userProgress = [];
        if (userId) {
            userProgress = await Progress_1.Progress.find({ userId, type: 'grammar' });
        }
        const results = grammarList.map(item => {
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
exports.getGrammarList = getGrammarList;
const getGrammarById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Grammar_1.Grammar.findOne({ id: Number(id) });
        if (!item) {
            return res.status(404).json({ message: 'Grammar pattern not found' });
        }
        res.status(200).json(item);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getGrammarById = getGrammarById;
const getGrammarQuestions = async (req, res) => {
    try {
        const quizData = await GrammarQuiz_1.GrammarQuiz.findOne();
        if (!quizData)
            return res.status(200).json({ fillInBlanks: [], starArrangements: [] });
        res.status(200).json(quizData);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getGrammarQuestions = getGrammarQuestions;
