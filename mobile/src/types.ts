export type User = {
  id: string;
  _id?: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  avatarUrl?: string;
  status?: string;
  isVip?: boolean;
};

export type ProgressState = {
  vocabMastered: string[];
  kanjiMastered: string[];
  grammarMastered: string[];
  readingMastered: string[];
  listeningMastered: string[];
  minnaMastered: number[];
};

export type SubscriptionStatus = {
  isVip: boolean;
  isAdmin?: boolean;
  subscription?: {
    planId?: { title?: string; price?: number; durationDays?: number };
    endDate?: string;
  } | null;
};

export type CoursePlan = {
  _id: string;
  title: string;
  description: string;
  price: number;
  durationDays: number;
  features: string[];
};

export type Transaction = {
  _id: string;
  transactionId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
};

export type AdminStats = {
  totalUsers: number;
  studentUsers: number;
  adminUsers: number;
  totalVipUsers: number;
  bannedUsers: number;
  totalRevenue: number;
};

export type Exam = {
  id: string;
  title?: string;
  year?: number;
  month?: number | string;
  vocabulary?: ExamSection;
  grammar?: ExamSection;
  grammar_reading?: ExamSection;
  listening?: ExamSection;
};

export type ExamSection = {
  questions: ExamQuestion[];
  mondais?: { id: number; title: string; audio_url?: string; local_audio?: string }[];
};

export type ExamQuestion = {
  id: string | number;
  mondai_id?: number;
  question_text: string;
  choices: string[];
  correct_answer_index: number;
  image_url?: string;
  audio_url?: string;
};
