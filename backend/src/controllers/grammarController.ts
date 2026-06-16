import { Request, Response } from 'express';
import { Grammar } from '../models/Grammar';
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

export const getGrammarList = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const filter: any = {};

    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { title: searchRegex },
        { meaning: searchRegex },
        { explain: searchRegex }
      ];
    }

    const grammarList = await Grammar.find(filter).sort({ id: 1 });

    const userId = getUserIdFromToken(req);
    let userProgress: any[] = [];
    if (userId) {
      userProgress = await Progress.find({ userId, type: 'grammar' });
    }

    const results = grammarList.map(item => {
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

export const getGrammarById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await Grammar.findOne({ id: Number(id) });

    if (!item) {
      return res.status(404).json({ message: 'Grammar pattern not found' });
    }

    res.status(200).json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
