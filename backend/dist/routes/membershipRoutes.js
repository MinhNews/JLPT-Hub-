"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const membershipController_1 = require("../controllers/membershipController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/plans', membershipController_1.getCoursePlans);
router.post('/payment-webhook', membershipController_1.handlePaymentWebhook);
// Auth protected routes
router.use(auth_1.authenticateToken);
router.get('/status', membershipController_1.getSubscriptionStatus);
router.post('/subscribe', membershipController_1.createSubscriptionTransaction);
router.post('/simulate-payment', membershipController_1.simulatePaymentSuccess);
router.get('/transactions/:id/status', membershipController_1.getTransactionStatus);
router.get('/transactions', membershipController_1.getUserTransactions);
exports.default = router;
