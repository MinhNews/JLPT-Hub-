"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
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
        const user = new User_1.User({
            email,
            passwordHash,
            name,
            role: 'student'
        });
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
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_for_jlpt_hub_321';
        const accessToken = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, secret, { expiresIn: '30d' });
        res.status(200).json({
            token: accessToken,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl || ''
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.loginUser = loginUser;
