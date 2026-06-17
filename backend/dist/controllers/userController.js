"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.updateProfile = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// Update user profile (name, and optionally password)
const updateProfile = async (req, res) => {
    try {
        const { name, currentPassword, newPassword } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Update name if provided
        if (name && name.trim() !== '') {
            user.name = name.trim();
        }
        // Update password if newPassword is provided
        if (newPassword && newPassword.trim() !== '') {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu hiện tại để đổi mật khẩu mới' });
            }
            // Google users don't have a password
            if (!user.passwordHash) {
                return res.status(400).json({ message: 'Tài khoản đăng nhập bằng Google không thể đổi mật khẩu theo cách này' });
            }
            // Check current password
            const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
            }
            // Hash new password
            const salt = await bcryptjs_1.default.genSalt(10);
            user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        }
        await user.save();
        res.status(200).json({
            message: 'Cập nhật thông tin cá nhân thành công',
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
exports.updateProfile = updateProfile;
// Upload avatar to Cloudinary and update user's avatarUrl
const uploadAvatar = async (req, res) => {
    try {
        const { avatarDataUri } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!avatarDataUri) {
            return res.status(400).json({ message: 'Vui lòng cung cấp dữ liệu hình ảnh' });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Upload base64 image directly to Cloudinary
        // Options: save in folder 'avatars', format check, auto face crop
        const uploadRes = await cloudinary_1.default.uploader.upload(avatarDataUri, {
            folder: 'jlpt_avatars',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            transformation: [
                { width: 300, height: 300, crop: 'fill', gravity: 'face' }
            ]
        });
        // Save Cloudinary secure url to database
        user.avatarUrl = uploadRes.secure_url;
        await user.save();
        res.status(200).json({
            message: 'Tải ảnh đại diện lên thành công',
            avatarUrl: user.avatarUrl,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl
            }
        });
    }
    catch (error) {
        console.error('Cloudinary upload error:', error);
        res.status(500).json({ message: error.message || 'Lỗi khi tải ảnh lên đám mây' });
    }
};
exports.uploadAvatar = uploadAvatar;
