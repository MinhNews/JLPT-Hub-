"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const seedAdminIfNeeded = async () => {
    try {
        // 1. Seed Admin
        const adminCount = await User_1.User.countDocuments({ role: 'admin' });
        if (adminCount === 0) {
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash('admin123', salt);
            const adminUser = new User_1.User({
                email: 'admin@jlpthub.com',
                passwordHash,
                name: 'Admin Hub',
                role: 'admin',
                status: 'active'
            });
            await adminUser.save();
            console.log('Seeded default admin user: admin@jlpthub.com / admin123');
        }
        // 2. Seed Default Students
        const defaultStudents = [
            { email: 'student1@jlpthub.com', name: 'Nguyễn Văn Học' },
            { email: 'student2@jlpthub.com', name: 'Trần Thị Viên' },
            { email: 'student3@jlpthub.com', name: 'Lê Văn VIP' }
        ];
        for (const studentInfo of defaultStudents) {
            const existing = await User_1.User.findOne({ email: studentInfo.email });
            if (!existing) {
                const salt = await bcryptjs_1.default.genSalt(10);
                const passwordHash = await bcryptjs_1.default.hash('student123', salt);
                const studentUser = new User_1.User({
                    email: studentInfo.email,
                    name: studentInfo.name,
                    passwordHash,
                    role: 'student',
                    status: 'active'
                });
                await studentUser.save();
                console.log(`Seeded student user: ${studentInfo.email} / student123`);
            }
        }
    }
    catch (err) {
        console.error('Failed to seed admin/student users:', err);
    }
};
const connectDB = async () => {
    try {
        const connStr = process.env.MONGODB_URI || '';
        if (!connStr) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        const conn = await mongoose_1.default.connect(connStr);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        // Seed admin & students if needed
        await seedAdminIfNeeded();
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
