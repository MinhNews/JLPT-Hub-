"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListeningLessonById = exports.getAllListeningLessons = void 0;
const ListeningLesson_1 = require("../models/ListeningLesson");
const Progress_1 = require("../models/Progress");
const Subscription_1 = require("../models/Subscription");
const User_1 = require("../models/User");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Helper to get userId optionally from token
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
// Helper to check if user has active VIP subscription
const checkIsVip = async (userId) => {
    if (!userId)
        return false;
    const user = await User_1.User.findById(userId);
    if (user && user.role === 'admin')
        return true;
    const activeSub = await Subscription_1.Subscription.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() }
    });
    return !!activeSub;
};
// Check if lesson is free (first 2 lessons are free)
const isLessonFree = (lessonId) => {
    const idLower = lessonId.toLowerCase();
    return idLower === 'chokai_1' || idLower === 'chokai_2';
};
const getAllListeningLessons = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const isVip = await checkIsVip(userId);
        const lessons = await ListeningLesson_1.ListeningLesson.find().select('id title part level audioUrl').sort({ id: 1 });
        // Fetch user progress if logged in
        let userProgress = [];
        if (userId) {
            userProgress = await Progress_1.Progress.find({ userId, type: 'listening' });
        }
        const lessonsWithStatus = lessons.map(lesson => {
            const progress = userProgress.find(p => p.lessonId === lesson.id);
            const free = isLessonFree(lesson.id);
            return {
                id: lesson.id,
                title: lesson.title,
                part: lesson.part,
                level: lesson.level,
                isFree: free,
                isLocked: !free && !isVip,
                isCompleted: progress ? progress.status === 'mastered' : false,
                score: progress ? progress.score : null
            };
        });
        res.status(200).json(lessonsWithStatus);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getAllListeningLessons = getAllListeningLessons;
const getListeningLessonById = async (req, res) => {
    try {
        const { id } = req.params;
        const lesson = await ListeningLesson_1.ListeningLesson.findOne({ id });
        if (!lesson) {
            return res.status(404).json({ message: 'Listening lesson not found' });
        }
        const userId = getUserIdFromToken(req);
        const isVip = await checkIsVip(userId);
        const free = isLessonFree(lesson.id);
        // Lock check
        if (!free && !isVip) {
            return res.status(403).json({
                message: 'This is a premium lesson. Upgrade to VIP to access all content.',
                isLocked: true,
                id: lesson.id,
                title: lesson.title,
                part: lesson.part
            });
        }
        // Return full lesson detail
        res.status(200).json({
            ...lesson.toObject(),
            isFree: free,
            isLocked: false
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getListeningLessonById = getListeningLessonById;
