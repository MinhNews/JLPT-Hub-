import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

const seedAdminIfNeeded = async () => {
  try {
    // 1. Seed Admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      const adminUser = new User({
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
      const existing = await User.findOne({ email: studentInfo.email });
      if (!existing) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('student123', salt);
        const studentUser = new User({
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
  } catch (err) {
    console.error('Failed to seed admin/student users:', err);
  }
};

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || '';
    if (!connStr) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    const conn = await mongoose.connect(connStr);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed admin & students if needed
    await seedAdminIfNeeded();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
