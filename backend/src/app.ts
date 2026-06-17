import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import listeningRoutes from './routes/listeningRoutes';
import readingRoutes from './routes/readingRoutes';
import vocabRoutes from './routes/vocabRoutes';
import grammarRoutes from './routes/grammarRoutes';
import kanjiRoutes from './routes/kanjiRoutes';
import progressRoutes from './routes/progressRoutes';
import notebookRoutes from './routes/notebookRoutes';
import membershipRoutes from './routes/membershipRoutes';
import adminRoutes from './routes/adminRoutes';
import userRoutes from './routes/userRoutes';
import minnaRoutes from './routes/minnaRoutes';
import kanjiLLRoutes from './routes/kanjiLLRoutes';
import examRoutes from './routes/examRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://jlpt-hub.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// Connect to Database
connectDB();

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listening', listeningRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/grammar', grammarRoutes);
app.use('/api/kanji', kanjiRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/notebook', notebookRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/minna', minnaRoutes);
app.use('/api/kanjill', kanjiLLRoutes);
app.use('/api/exams', examRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('JLPT Hub Commercial API is running...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
