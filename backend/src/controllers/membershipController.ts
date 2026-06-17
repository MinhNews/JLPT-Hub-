import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CoursePlan } from '../models/CoursePlan';
import { Subscription } from '../models/Subscription';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';

const IS_PROD = process.env.NODE_ENV === 'production';

const isPaymentWebhookAuthorized = (req: any) => {
  const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!configuredSecret) {
    return true;
  }

  const headerSecret =
    req.headers['x-webhook-secret'] ||
    req.headers['x-payment-webhook-secret'] ||
    req.headers['x-sepay-secret'] ||
    '';
  const bearerToken = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const queryToken = String(req.query?.token || '');

  return headerSecret === configuredSecret || bearerToken === configuredSecret || queryToken === configuredSecret;
};

const parsePaymentAmount = (amount: any) => {
  if (typeof amount === 'number') return amount;
  if (typeof amount !== 'string') return Number(amount);

  const normalized = amount.replace(/[^\d.-]/g, '');
  return Number(normalized);
};

// Pre-seed plans if database is empty
const seedPlansIfNeeded = async () => {
  const count = await CoursePlan.countDocuments();
  if (count === 0) {
    const defaultPlans = [
      {
        title: 'N3 VIP 3 Tháng',
        description: 'Truy cập toàn bộ khóa học N3, đề thi thử và giải thích chi tiết trong 90 ngày.',
        price: 99000,
        durationDays: 90,
        features: [
          'Mở khóa toàn bộ 28 bài nghe hiểu Chokai',
          'Mở khóa toàn bộ 72 bài đọc hiểu Dokkai',
          'Giải thích chi tiết 100% bằng tiếng Việt',
          'Bí kíp nghe hiểu & đọc hiểu',
          'Đồng bộ tiến độ học tập đa thiết bị'
        ],
        status: 'active'
      },
      {
        title: 'N3 VIP Trọn Đời',
        description: 'Mở khóa trọn bộ tính năng mãi mãi, học không giới hạn trên cả máy tính và điện thoại.',
        price: 299000,
        durationDays: 9999,
        features: [
          'Tất cả quyền lợi của gói 3 tháng',
          'Sở hữu vĩnh viễn, không gia hạn thêm',
          'Hỗ trợ đặc quyền từ giảng viên',
          'Tặng kèm kho tài liệu ôn thi JLPT N3 bổ sung'
        ],
        status: 'active'
      }
    ];
    await CoursePlan.insertMany(defaultPlans);
    console.log('Pre-seeded default CoursePlans into database.');
  }
};

// Fetch available subscription plans
export const getCoursePlans = async (req: AuthRequest, res: Response) => {
  try {
    await seedPlansIfNeeded();
    const plans = await CoursePlan.find({ status: 'active' }).sort({ price: 1 });
    res.status(200).json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Get current user's membership status
export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user is Admin
    const user = await User.findById(userId);
    if (user && user.role === 'admin') {
      return res.status(200).json({
        isVip: true,
        isAdmin: true,
        subscription: {
          planId: { title: 'Hệ thống Admin' },
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year
        }
      });
    }

    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('planId', 'title price durationDays');

    if (!subscription) {
      return res.status(200).json({
        isVip: false,
        subscription: null
      });
    }

    res.status(200).json({
      isVip: true,
      subscription
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Helper to activate or extend VIP subscription
const activateVipSubscription = async (userId: string, planId: string) => {
  const plan = await CoursePlan.findById(planId);
  if (!plan) {
    throw new Error('Associated course plan not found');
  }

  const existingActiveSub = await Subscription.findOne({
    userId,
    status: 'active',
    endDate: { $gt: new Date() }
  });

  let startDate = new Date();
  if (existingActiveSub) {
    startDate = new Date(existingActiveSub.endDate);
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  if (existingActiveSub) {
    existingActiveSub.endDate = endDate;
    await existingActiveSub.save();
  } else {
    const newSub = new Subscription({
      userId,
      planId: plan._id,
      status: 'active',
      startDate,
      endDate
    });
    await newSub.save();
  }
};

// Subscribe / Create transaction
export const createSubscriptionTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { planId, paymentMethod } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!planId || !paymentMethod) {
      return res.status(400).json({ message: 'Please provide planId and paymentMethod' });
    }

    const plan = await CoursePlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Course plan not found' });
    }

    // Generate unique 8-digit order number for VietQR
    const transactionId = Math.floor(10000000 + Math.random() * 90000000).toString();

    const transaction = new Transaction({
      userId,
      planId,
      amount: plan.price,
      paymentMethod,
      status: 'pending',
      transactionId
    });

    await transaction.save();

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Simulate Payment Success (Dev/Test helper)
export const simulatePaymentSuccess = async (req: AuthRequest, res: Response) => {
  try {
    if (IS_PROD || process.env.ENABLE_PAYMENT_SIMULATION !== 'true') {
      return res.status(404).json({ message: 'Payment simulation is disabled' });
    }

    const userId = req.user?.id;
    const { transactionId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const transaction = await Transaction.findOne({ transactionId, userId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'completed') {
      return res.status(200).json({ message: 'Transaction is already completed', transaction });
    }

    // 1. Mark transaction as completed
    transaction.status = 'completed';
    await transaction.save();

    // 2. Activate subscription
    await activateVipSubscription(userId, transaction.planId.toString());

    res.status(200).json({
      message: 'Payment simulated successfully. VIP status activated!',
      transaction
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Get single transaction status (for frontend polling)
export const getTransactionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({ status: transaction.status });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Handle SePay/Cassso Webhook callback
export const handlePaymentWebhook = async (req: any, res: Response) => {
  try {
    if (!isPaymentWebhookAuthorized(req)) {
      return res.status(401).json({ error: 1, message: 'Unauthorized payment webhook' });
    }

    // SePay sends webhook data in body
    const { content, code, amount, transferType } = req.body;

    console.log('Received Payment Webhook:', req.body);

    if (transferType && transferType !== 'in') {
      return res.status(200).json({ error: 0, message: 'Ignore money out' });
    }

    const receivedAmount = parsePaymentAmount(amount);
    if (!Number.isFinite(receivedAmount) || receivedAmount <= 0) {
      return res.status(400).json({ error: 1, message: 'Invalid payment amount' });
    }

    const textToSearch = `${content || ''} ${code || ''}`.toLowerCase();
    
    // Find all pending transactions created in the last 2 days
    const pendingTransactions = await Transaction.find({
      status: 'pending',
      createdAt: { $gt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    });
    
    let matchedTx = null;
    for (const tx of pendingTransactions) {
      if (textToSearch.includes(tx.transactionId.toLowerCase())) {
        matchedTx = tx;
        break;
      }
    }

    if (!matchedTx) {
      console.log('No matching pending transaction found for webhook content:', textToSearch);
      return res.status(200).json({ error: 0, message: 'Transaction not found or already processed' });
    }

    // Check amount
    if (matchedTx.status === 'completed') {
      return res.status(200).json({ error: 0, message: 'Transaction already processed' });
    }

    if (receivedAmount < matchedTx.amount) {
      console.log(`Amount mismatch: expected ${matchedTx.amount}, received ${receivedAmount}`);
      return res.status(400).json({ message: 'Amount mismatch' });
    }

    // Mark transaction as completed
    matchedTx.status = 'completed';
    await matchedTx.save();

    // Activate subscription
    await activateVipSubscription(matchedTx.userId.toString(), matchedTx.planId.toString());

    console.log(`Successfully activated VIP for user ${matchedTx.userId} via bank transfer.`);
    return res.status(200).json({ error: 0, message: 'Success' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// Get user transactions
export const getUserTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const transactions = await Transaction.find({ userId })
      .populate('planId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};
