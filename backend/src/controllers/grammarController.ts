import { Request, Response } from 'express';
import { Grammar } from '../models/Grammar';
import { GrammarQuiz } from '../models/GrammarQuiz';
import { Progress } from '../models/Progress';
import { getUserIdFromRequest } from '../utils/auth';

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

    const userId = getUserIdFromRequest(req);
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

export const getGrammarQuestions = async (req: Request, res: Response) => {
  try {
    const quizData = await GrammarQuiz.findOne();
    if (!quizData) return res.status(200).json({ fillInBlanks: [], starArrangements: [] });
    res.status(200).json(quizData);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
