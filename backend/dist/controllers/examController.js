"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExamDetails = exports.getExamsList = void 0;
const models_1 = require("../models");
const getExamsList = async (req, res) => {
    try {
        const { level } = req.params;
        // Chỉ lấy các trường cơ bản để tăng tốc độ, không lấy các mảng câu hỏi khổng lồ
        const exams = await models_1.Exam.find({ level: level.toUpperCase() }).select('exam_id year month title').lean();
        const list = exams.map((exam) => ({
            id: exam.exam_id,
            year: exam.year,
            month: exam.month,
            title: exam.title,
            hasVocabulary: true, // Vì dữ liệu chuẩn nên luôn có đủ 3 phần
            hasGrammar: true,
            hasListening: true
        }));
        list.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách đề thi' });
    }
};
exports.getExamsList = getExamsList;
const getExamDetails = async (req, res) => {
    try {
        const { level, id } = req.params;
        const exam = await models_1.Exam.findOne({ level: level.toUpperCase(), exam_id: id }).lean();
        if (!exam) {
            return res.status(404).json({ message: 'Không tìm thấy đề thi' });
        }
        // Tái cấu trúc lại thuộc tính id để Frontend dễ nhận diện
        const formattedExam = { ...exam, id: exam.exam_id };
        res.json(formattedExam);
    }
    catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy chi tiết đề thi' });
    }
};
exports.getExamDetails = getExamDetails;
