import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { OAuth2Client } from 'google-auth-library';
import { getJwtSecret } from '../utils/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '1061656991815-05nll45ijshstr1l3t4nj1phm6o04vih.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const IS_PROD = process.env.NODE_ENV === 'production';
const DEFAULT_SESSION_DAYS = 7;
const REMEMBER_SESSION_DAYS = 30;

const getSessionDays = (rememberMe?: boolean) => rememberMe ? REMEMBER_SESSION_DAYS : DEFAULT_SESSION_DAYS;
const getCookieOptions = (rememberMe?: boolean) => ({
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? ('none' as const) : ('lax' as const),
  maxAge: getSessionDays(rememberMe) * 24 * 60 * 60 * 1000,
  path: '/',
});

const signToken = (userId: any, role: string, rememberMe?: boolean) => {
  const secret = getJwtSecret();
  return jwt.sign({ id: userId, role }, secret, { expiresIn: `${getSessionDays(rememberMe)}d` });
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ email, passwordHash, name, role: 'student' });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || user.status === 'banned') {
      return res.status(400).json({ message: 'Invalid credentials or account is banned' });
    }

    const isMatch = user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash as string)
      : false;
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const accessToken = signToken(user._id, user.role, Boolean(rememberMe));
    res.cookie('token', accessToken, getCookieOptions(Boolean(rememberMe)));

    res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl || '',
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential, rememberMe } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { email, name, picture } = payload;
    if (!email) {
      return res.status(400).json({ message: 'Google account has no email' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        name: name || 'Google User',
        role: 'student',
        avatarUrl: picture || '',
        passwordHash: '',
      });
      await user.save();
    } else if (user.status === 'banned') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa.' });
    }

    const accessToken = signToken(user._id, user.role, Boolean(rememberMe));
    res.cookie('token', accessToken, getCookieOptions(Boolean(rememberMe)));

    res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl || '',
      },
    });
  } catch (error: any) {
    console.error('Google Login Error:', error);
    res.status(500).json({ message: 'Lỗi xác thực Google: ' + (error.message || 'Server Error') });
  }
};

export const logoutUser = (_req: Request, res: Response) => {
  res.clearCookie('token', { ...getCookieOptions(false), maxAge: 0 });
  res.status(200).json({ message: 'Logged out successfully' });
};
