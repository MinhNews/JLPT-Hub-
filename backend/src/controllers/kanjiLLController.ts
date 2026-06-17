import { Request, Response } from 'express';
import { KanjiLL } from '../models';

export const getAllLessons = async (req: Request, res: Response) => {
  try {
    const data = await KanjiLL.find().select('lessonId title kanjis').sort({ lessonId: 1 });
    // Only return summary to save bandwidth
    const summary = data.map((lesson: any) => ({
      lessonId: lesson.lessonId,
      title: lesson.title,
      kanjiCount: lesson.kanjis.length
    }));
    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getLessonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lesson = await KanjiLL.findOne({ lessonId: Number(id) });
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    res.json(lesson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
