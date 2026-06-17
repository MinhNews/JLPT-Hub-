import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { CoursePlan } from '../models/CoursePlan';
import { Transaction } from '../models/Transaction';

// Get system statistics for admin dashboard
export const getSystemStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const bannedUsers = await User.countDocuments({ status: 'banned' });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const studentUsers = totalUsers - adminUsers;

    // Count VIP users (excluding admins who are auto-VIP)
    const activeSubscribers = await Subscription.distinct('userId', {
      status: 'active',
      endDate: { $gt: new Date() }
    });
    const totalVipUsers = activeSubscribers.length + adminUsers;

    // Total revenue from successful transactions
    const completedTransactions = await Transaction.find({ status: 'completed' });
    const totalRevenue = completedTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);

    res.status(200).json({
      stats: {
        totalUsers,
        studentUsers,
        adminUsers,
        bannedUsers,
        totalVipUsers,
        totalRevenue
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Get all users list with pagination and search
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const total = await User.countDocuments(searchQuery);
    const users = await User.find(searchQuery)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach VIP status to each user
    const usersWithVip = await Promise.all(
      users.map(async (u: any) => {
        if (u.role === 'admin') {
          return { ...u, isVip: true };
        }
        const activeSub = await Subscription.findOne({
          userId: u._id,
          status: 'active',
          endDate: { $gt: new Date() }
        });
        return {
          ...u,
          isVip: !!activeSub,
          vipPlanTitle: activeSub ? 'VIP Active' : null
        };
      })
    );

    res.status(200).json({
      users: usersWithVip,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Toggle user VIP status (Grant / Revoke VIP)
export const toggleUserVip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin is already VIP automatically' });
    }

    // Check if user has active subscription
    const activeSub = await Subscription.findOne({
      userId: id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (activeSub) {
      // Revoke VIP: Expire subscription
      activeSub.status = 'expired';
      activeSub.endDate = new Date();
      await activeSub.save();
      return res.status(200).json({ message: 'Revoked VIP status successfully', isVip: false });
    } else {
      // Grant VIP: Always grant lifetime access (admin manual grant)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 9999); // ~27 years = effectively permanent

      const newSub = new Subscription({
        userId: id,
        planId: null,
        status: 'active',
        startDate: new Date(),
        endDate
      });

      await newSub.save();
      return res.status(200).json({ message: 'Granted VIP status successfully', isVip: true });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Toggle user banned/active status
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban an admin user' });
    }

    user.status = user.status === 'banned' ? 'active' : 'banned';
    await user.save();

    res.status(200).json({
      message: `User is now ${user.status}`,
      status: user.status
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Update user role (Promote to Admin / Demote to Student)
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role !== 'student' && role !== 'admin') {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent demoting self (just in case)
    if (user._id.toString() === req.user?.id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      message: `User role updated to ${role}`,
      role: user.role
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
