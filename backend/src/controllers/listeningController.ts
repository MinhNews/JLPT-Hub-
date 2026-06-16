import { Request, Response } from 'express';
import { ListeningLesson } from '../models/ListeningLesson';
import { Progress } from '../models/Progress';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

// Helper to get userId optionally from token
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

// Helper to check if user has active VIP subscription
const checkIsVip = async (userId: string | null): Promise<boolean> => {
  if (!userId) return false;
  const user = await User.findById(userId);
  if (user && user.role === 'admin') return true;

  const activeSub = await Subscription.findOne({
    userId,
    status: 'active',
    endDate: { $gt: new Date() }
  });
  return !!activeSub;
};

// Check if lesson is free (first 2 lessons are free)
const isLessonFree = (lessonId: string): boolean => {
  const idLower = lessonId.toLowerCase();
  return idLower === 'chokai_1' || idLower === 'chokai_2';
};

export const getAllListeningLessons = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req);
    const isVip = await checkIsVip(userId);

    const lessons = await ListeningLesson.find().select('id title part level audioUrl').sort({ id: 1 });
    
    // Fetch user progress if logged in
    let userProgress: any[] = [];
    if (userId) {
      userProgress = await Progress.find({ userId, type: 'listening' });
    }

    const lessonsWithStatus = lessons.map(lesson => {
      const progress = userProgress.find(p => p.lessonId === lesson.id);
      const free = isLessonFree(lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        part: lesson.part,
        level: lesson.level,
        isFree: free,
        isLocked: !free && !isVip,
        isCompleted: progress ? progress.status === 'mastered' : false,
        score: progress ? progress.score : null
      };
    });

    res.status(200).json(lessonsWithStatus);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const getListeningLessonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lesson = await ListeningLesson.findOne({ id });

    if (!lesson) {
      return res.status(404).json({ message: 'Listening lesson not found' });
    }

    const userId = getUserIdFromToken(req);
    const isVip = await checkIsVip(userId);
    const free = isLessonFree(lesson.id);

    // Lock check
    if (!free && !isVip) {
      return res.status(403).json({
        message: 'This is a premium lesson. Upgrade to VIP to access all content.',
        isLocked: true,
        id: lesson.id,
        title: lesson.title,
        part: lesson.part
      });
    }

    // Return full lesson detail
    res.status(200).json({
      ...lesson.toObject(),
      isFree: free,
      isLocked: false
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
