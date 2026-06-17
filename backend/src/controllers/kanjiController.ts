import { Request, Response } from 'express';
import { Kanji } from '../models/Kanji';
import { Progress } from '../models/Progress';
import { getUserIdFromRequest } from '../utils/auth';

export const getKanjiList = async (req: Request, res: Response) => {
  try {
    const { lesson, search } = req.query;
    const filter: any = {};

    if (lesson) filter.lesson = lesson;
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { kanji: searchRegex },
        { reading: searchRegex },
        { meaning_vn: searchRegex },
        { meaning_hv: searchRegex }
      ];
    }

    // Sort by lesson string/number naturally or by creation
    const kanjiList = await Kanji.find(filter).sort({ lesson: 1, kanji: 1 });

    const userId = getUserIdFromRequest(req);
    let userProgress: any[] = [];
    if (userId) {
      userProgress = await Progress.find({ userId, type: 'kanji' });
    }

    const results = kanjiList.map(item => {
      const progress = userProgress.find(p => p.lessonId === String(item._id));
      return {
        ...item.toObject(),
        isCompleted: progress ? progress.status === 'mastered' : false
      };
    });

    res.status(200).json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const getKanjiLessons = async (req: Request, res: Response) => {
  try {
    const lessons = await Kanji.distinct('lesson');
    
    // Sort lessons (e.g., 第1課, 第2課) numerically
    const sortedLessons = lessons.sort((a: string, b: string) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    res.status(200).json(sortedLessons);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
