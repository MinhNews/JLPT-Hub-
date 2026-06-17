import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import cloudinary from '../config/cloudinary';

// Update user profile (name, and optionally password)
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
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
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash as string);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
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
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Upload avatar to Cloudinary and update user's avatarUrl
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const { avatarDataUri } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!avatarDataUri) {
      return res.status(400).json({ message: 'Vui lòng cung cấp dữ liệu hình ảnh' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Upload base64 image directly to Cloudinary
    // Options: save in folder 'avatars', format check, auto face crop
    const uploadRes = await cloudinary.uploader.upload(avatarDataUri, {
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
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ message: error.message || 'Lỗi khi tải ảnh lên đám mây' });
  }
};
