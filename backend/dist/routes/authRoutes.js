"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.post('/register', authController_1.registerUser);
router.post('/login', authController_1.loginUser);
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user?.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: error.message || 'Server Error' });
    }
});
exports.default = router;
