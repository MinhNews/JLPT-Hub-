"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRole = exports.toggleUserStatus = exports.toggleUserVip = exports.getAllUsers = exports.getSystemStats = void 0;
const User_1 = require("../models/User");
const Subscription_1 = require("../models/Subscription");
const CoursePlan_1 = require("../models/CoursePlan");
const Transaction_1 = require("../models/Transaction");
// Get system statistics for admin dashboard
const getSystemStats = async (req, res) => {
    try {
        const totalUsers = await User_1.User.countDocuments();
        const bannedUsers = await User_1.User.countDocuments({ status: 'banned' });
        const adminUsers = await User_1.User.countDocuments({ role: 'admin' });
        const studentUsers = totalUsers - adminUsers;
        // Count VIP users (excluding admins who are auto-VIP)
        const activeSubscribers = await Subscription_1.Subscription.distinct('userId', {
            status: 'active',
            endDate: { $gt: new Date() }
        });
        const totalVipUsers = activeSubscribers.length + adminUsers;
        // Total revenue from successful transactions
        const completedTransactions = await Transaction_1.Transaction.find({ status: 'completed' });
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
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getSystemStats = getSystemStats;
// Get all users list with pagination and search
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;
        const searchQuery = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }
            : {};
        const total = await User_1.User.countDocuments(searchQuery);
        const users = await User_1.User.find(searchQuery)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        // Attach VIP status to each user
        const usersWithVip = await Promise.all(users.map(async (u) => {
            if (u.role === 'admin') {
                return { ...u, isVip: true };
            }
            const activeSub = await Subscription_1.Subscription.findOne({
                userId: u._id,
                status: 'active',
                endDate: { $gt: new Date() }
            });
            return {
                ...u,
                isVip: !!activeSub,
                vipPlanTitle: activeSub ? 'VIP Active' : null
            };
        }));
        res.status(200).json({
            users: usersWithVip,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.getAllUsers = getAllUsers;
// Toggle user VIP status (Grant / Revoke VIP)
const toggleUserVip = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Admin is already VIP automatically' });
        }
        // Check if user has active subscription
        const activeSub = await Subscription_1.Subscription.findOne({
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
        }
        else {
            // Grant VIP: Find or seed default course plan
            let plan = await CoursePlan_1.CoursePlan.findOne({ status: 'active' });
            if (!plan) {
                // Create a default course plan if none exists
                plan = new CoursePlan_1.CoursePlan({
                    title: 'N3 VIP Trọn Đời',
                    description: 'Mở khóa trọn bộ tính năng học tập',
                    price: 299000,
                    durationDays: 9999,
                    features: ['All VIP Features'],
                    status: 'active'
                });
                await plan.save();
            }
            // Create new Subscription
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (plan.durationDays || 30));
            const newSub = new Subscription_1.Subscription({
                userId: id,
                planId: plan._id,
                status: 'active',
                startDate: new Date(),
                endDate
            });
            await newSub.save();
            return res.status(200).json({ message: 'Granted VIP status successfully', isVip: true });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.toggleUserVip = toggleUserVip;
// Toggle user banned/active status
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.User.findById(id);
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
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.toggleUserStatus = toggleUserStatus;
// Update user role (Promote to Admin / Demote to Student)
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (role !== 'student' && role !== 'admin') {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const user = await User_1.User.findById(id);
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
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};
exports.updateUserRole = updateUserRole;
