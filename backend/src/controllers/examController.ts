import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const getExamsData = (level: string) => {
  const file = path.join(__dirname, `../../data/exams_${level.toLowerCase()}.json`);
  if (!fs.existsSync(file)) {
    return [];
  }
  const data = fs.readFileSync(file, 'utf-8');
  return JSON.parse(data);
};

export const getExamsList = (req: Request, res: Response) => {
  try {
    const { level } = req.params;
    const exams = getExamsData(level);
    const list = exams.map((exam: any) => ({
      id: exam.id,
      year: exam.year,
      month: exam.month,
      title: exam.title,
      hasVocabulary: !!exam.vocabulary,
      hasGrammar: !!exam.grammar_reading || !!exam.grammar,
      hasListening: !!exam.listening
    }));
    list.sort((a: any, b: any) => parseInt(b.id) - parseInt(a.id));
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đề thi' });
  }
};

export const getExamDetails = (req: Request, res: Response) => {
  try {
    const { level, id } = req.params;
    const exams = getExamsData(level);
    const exam = exams.find((e: any) => e.id === id);
    if (!exam) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết đề thi' });
  }
};
