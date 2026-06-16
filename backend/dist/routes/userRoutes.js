"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.put('/profile', auth_1.authenticateToken, userController_1.updateProfile);
router.post('/profile/avatar', auth_1.authenticateToken, userController_1.uploadAvatar);
exports.default = router;
