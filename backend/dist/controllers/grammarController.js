"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGrammarById = exports.getGrammarList = void 0;
const Grammar_1 = require("../models/Grammar");
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
        const userId = getUserIdFromToken(req);
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
