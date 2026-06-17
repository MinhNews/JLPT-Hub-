"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.googleLogin = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const google_auth_library_1 = require("google-auth-library");
const auth_1 = require("../utils/auth");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '1061656991815-05nll45ijshstr1l3t4nj1phm6o04vih.apps.googleusercontent.com';
const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
};
const signToken = (userId, role) => {
    const secret = (0, auth_1.getJwtSecret)();
    return jsonwebtoken_1.default.sign({ id: userId, role }, secret, { expiresIn: '30d' });
};
const registerUser = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }
        const userExists = await User_1.User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = new User_1.User({ email, passwordHash, name, role: 'student' });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        const user = await User_1.User.findOne({ email });
        if (!user || user.status === 'banned') {
            return res.status(400).json({ message: 'Invalid credentials or account is banned' });
        }
        const isMatch = user.passwordHash
            ? await bcryptjs_1.default.compare(password, user.passwordHash)
            : false;
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const accessToken = signToken(user._id, user.role);
        res.cookie('token', accessToken, COOKIE_OPTIONS);
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
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.loginUser = loginUser;
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
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
        let user = await User_1.User.findOne({ email });
        if (!user) {
            user = new User_1.User({
                email,
                name: name || 'Google User',
                role: 'student',
                avatarUrl: picture || '',
                passwordHash: '',
            });
            await user.save();
        }
        else if (user.status === 'banned') {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa.' });
        }
        const accessToken = signToken(user._id, user.role);
        res.cookie('token', accessToken, COOKIE_OPTIONS);
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
    }
    catch (error) {
        console.error('Google Login Error:', error);
        res.status(500).json({ message: 'Lỗi xác thực Google: ' + (error.message || 'Server Error') });
    }
};
exports.googleLogin = googleLogin;
const logoutUser = (_req, res) => {
    res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
    res.status(200).json({ message: 'Logged out successfully' });
};
exports.logoutUser = logoutUser;
