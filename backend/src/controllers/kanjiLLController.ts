import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const getAllLessons = (req: Request, res: Response) => {
  try {
    const dataPath = path.join(__dirname, '../../data/kanji_look_learn.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ message: 'Kanji Look and Learn data not found' });
    }
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    // Only return summary to save bandwidth
    const summary = data.map((lesson: any) => ({
      lessonId: lesson.lessonId,
      title: lesson.title,
      kanjiCount: lesson.kanjis.length
    }));
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getLessonById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dataPath = path.join(__dirname, '../../data/kanji_look_learn.json');
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ message: 'Data not found' });
    }
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const lesson = data.find((l: any) => l.lessonId.toString() === id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
