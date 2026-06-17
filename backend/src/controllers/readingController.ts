import { Request, Response } from 'express';
import { ReadingLesson } from '../models/ReadingLesson';
import { Progress } from '../models/Progress';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { getUserIdFromRequest } from '../utils/auth';

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

const isLessonFree = (lessonId: string): boolean => {
  const idLower = lessonId.toLowerCase();
  return idLower === '1' || idLower === '2' || idLower === 'dokkai_1' || idLower === 'dokkai_2';
};

const getLessonOrder = (lessonId: string): number => {
  const match = String(lessonId || '').match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
};

export const getAllReadingLessons = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req);
    const isVip = await checkIsVip(userId);

    const lessons = await ReadingLesson.find().select('id title part level questions').lean();
    lessons.sort((a: any, b: any) => {
      const orderDiff = getLessonOrder(a.id) - getLessonOrder(b.id);
      return orderDiff || String(a.id).localeCompare(String(b.id), 'vi', { numeric: true });
    });
    
    let userProgress: any[] = [];
    if (userId) {
      userProgress = await Progress.find({ userId, type: 'reading' });
    }

    const lessonsWithStatus = lessons.map(lesson => {
      const progress = userProgress.find(p => p.lessonId === lesson.id);
      const free = isLessonFree(lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        part: lesson.part,
        level: lesson.level,
        questionCount: lesson.questions?.length || 0,
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

export const getReadingLessonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lesson = await ReadingLesson.findOne({ id });

    if (!lesson) {
      return res.status(404).json({ message: 'Reading lesson not found' });
    }

    const userId = getUserIdFromRequest(req);
    const isVip = await checkIsVip(userId);
    const free = isLessonFree(lesson.id);

    if (!free && !isVip) {
      return res.status(403).json({
        message: 'This is a premium lesson. Upgrade to VIP to access all content.',
        isLocked: true,
        id: lesson.id,
        title: lesson.title,
        part: lesson.part
      });
    }

    res.status(200).json({
      ...lesson.toObject(),
      isFree: free,
      isLocked: false
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
