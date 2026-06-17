"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLessonById = exports.getAllLessons = void 0;
const models_1 = require("../models");
const getAllLessons = async (req, res) => {
    try {
        const data = await models_1.KanjiLL.find().select('lessonId title kanjis').sort({ lessonId: 1 });
        // Only return summary to save bandwidth
        const summary = data.map((lesson) => ({
            lessonId: lesson.lessonId,
            title: lesson.title,
            kanjiCount: lesson.kanjis.length
        }));
        res.json(summary);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getAllLessons = getAllLessons;
const getLessonById = async (req, res) => {
    try {
        const { id } = req.params;
        const lesson = await models_1.KanjiLL.findOne({ lessonId: Number(id) });
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.json(lesson);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getLessonById = getLessonById;
