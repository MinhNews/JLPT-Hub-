import { Request, Response } from 'express';
import { MinnaLesson } from '../models/MinnaLesson';
import { Subscription } from '../models/Subscription';
import { getUserFromRequest } from '../utils/auth';

const isVipUser = async (userId: string): Promise<boolean> => {
  const sub = await Subscription.findOne({
    userId,
    status: 'active',
    endDate: { $gt: new Date() }
  });
  return !!sub;
};

// GET /api/minna/lessons?level=N5
export const getMinnaLessons = async (req: Request, res: Response) => {
  try {
    const { level } = req.query;
    const filter: any = {};
    if (level && ['N5', 'N4'].includes(level as string)) filter.level = level;

    const lessons = await MinnaLesson.find(filter)
      .select('lessonNumber level titleJp titleVi')
      .sort({ lessonNumber: 1 });

    res.status(200).json(lessons);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/minna/lessons/:number
export const getMinnaLessonDetail = async (req: Request, res: Response) => {
  try {
    const lessonNum = parseInt(req.params.number);
    if (isNaN(lessonNum)) return res.status(400).json({ message: 'Invalid lesson number' });

    const lesson = await MinnaLesson.findOne({ lessonNumber: lessonNum });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    // N5 lessons 1-25 and the first five N4 lessons 26-30 are free; lesson 31+ requires VIP.
    if (lessonNum >= 31) {
      const user = getUserFromRequest(req);
      if (!user) {
        return res.status(403).json({ message: 'vip_required', lessonNumber: lessonNum });
      }
      if (user.role !== 'admin') {
        const hasVip = await isVipUser(user.id);
        if (!hasVip) {
          return res.status(403).json({ message: 'vip_required', lessonNumber: lessonNum });
        }
      }
    }

    res.status(200).json(lesson);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
