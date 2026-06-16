import { Router } from 'express';
import { 
  getCoursePlans, 
  getSubscriptionStatus, 
  createSubscriptionTransaction, 
  simulatePaymentSuccess,
  getTransactionStatus,
  handlePaymentWebhook,
  getUserTransactions
} from '../controllers/membershipController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/plans', getCoursePlans);
router.post('/payment-webhook', handlePaymentWebhook);

// Auth protected routes
router.use(authenticateToken);
router.get('/status', getSubscriptionStatus);
router.post('/subscribe', createSubscriptionTransaction);
router.post('/simulate-payment', simulatePaymentSuccess);
router.get('/transactions/:id/status', getTransactionStatus);
router.get('/transactions', getUserTransactions);

export default router;
