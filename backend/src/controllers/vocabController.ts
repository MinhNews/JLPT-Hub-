import { Request, Response } from 'express';
import { Vocabulary } from '../models/Vocabulary';
import { Progress } from '../models/Progress';
import jwt from 'jsonwebtoken';

const getUserIdFromToken = (req: Request): string | null => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_for_jlpt_hub_321';
    const decoded: any = jwt.verify(token, secret);
    return decoded.id;
  } catch (err) {
    return null;
  }
};

export const getVocabList = async (req: Request, res: Response) => {
  try {
    const { category, section, search } = req.query;
    const filter: any = {};

    if (category) filter.category = category;
    if (section) filter.section = section;
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { kanji: searchRegex },
        { reading: searchRegex },
        { meaning: searchRegex },
        { hanviet: searchRegex }
      ];
    }

    const vocabList = await Vocabulary.find(filter).sort({ kanji: 1 });

    // Optional user progress linking
    const userId = getUserIdFromToken(req);
    let userProgress: any[] = [];
    if (userId) {
      userProgress = await Progress.find({ userId, type: 'vocab' });
    }

    const results = vocabList.map(item => {
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

export const getVocabCategories = async (req: Request, res: Response) => {
  try {
    // Group categories and sections
    const categories = await Vocabulary.aggregate([
      {
        $group: {
          _id: '$category',
          sections: { $addToSet: '$section' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format structure: { [category]: string[] }
    const formatted: { [key: string]: string[] } = {};
    categories.forEach(item => {
      if (item._id) {
        formatted[item._id] = item.sections.sort();
      }
    });

    res.status(200).json(formatted);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
