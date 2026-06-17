"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMinnaLessonDetail = exports.getMinnaLessons = void 0;
const MinnaLesson_1 = require("../models/MinnaLesson");
const Subscription_1 = require("../models/Subscription");
const auth_1 = require("../utils/auth");
const isVipUser = async (userId) => {
    const sub = await Subscription_1.Subscription.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() }
    });
    return !!sub;
};
// GET /api/minna/lessons?level=N5
const getMinnaLessons = async (req, res) => {
    try {
        const { level } = req.query;
        const filter = {};
        if (level && ['N5', 'N4'].includes(level))
            filter.level = level;
        const lessons = await MinnaLesson_1.MinnaLesson.find(filter)
            .select('lessonNumber level titleJp titleVi')
            .sort({ lessonNumber: 1 });
        res.status(200).json(lessons);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getMinnaLessons = getMinnaLessons;
// GET /api/minna/lessons/:number
const getMinnaLessonDetail = async (req, res) => {
    try {
        const lessonNum = parseInt(req.params.number);
        if (isNaN(lessonNum))
            return res.status(400).json({ message: 'Invalid lesson number' });
        const lesson = await MinnaLesson_1.MinnaLesson.findOne({ lessonNumber: lessonNum });
        if (!lesson)
            return res.status(404).json({ message: 'Lesson not found' });
        // Lessons 1-2 are free; 3+ require VIP
        if (lessonNum > 2) {
            const user = (0, auth_1.getUserFromRequest)(req);
            if (!user) {
                return res.status(403).json({ message: 'vip_required', lessonNumber: lessonNum });
            }
            if (user.role !== 'admin') {
                const hasVip = await isVipUser(user.id);
                if (!hasVip) {
                    return res.status(403).json({ message: 'vip_required', lessonNumber: lessonNum });
                }
            }
        }
        res.status(200).json(lesson);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getMinnaLessonDetail = getMinnaLessonDetail;
