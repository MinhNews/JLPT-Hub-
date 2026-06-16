"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
// Apply admin protection to all routes in this file
router.use(auth_1.authenticateToken);
router.use(auth_1.authorizeAdmin);
// Admin dashboard routes
router.get('/stats', adminController_1.getSystemStats);
router.get('/users', adminController_1.getAllUsers);
router.put('/users/:id/vip', adminController_1.toggleUserVip);
router.put('/users/:id/status', adminController_1.toggleUserStatus);
router.put('/users/:id/role', adminController_1.updateUserRole);
exports.default = router;
