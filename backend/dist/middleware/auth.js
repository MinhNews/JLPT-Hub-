"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../utils/auth");
const authenticateToken = (req, res, next) => {
    const token = (0, auth_1.getAuthTokenFromRequest)(req);
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    let secret;
    try {
        secret = (0, auth_1.getJwtSecret)();
    }
    catch (error) {
        return res.status(500).json({ message: error.message || 'Server auth configuration error' });
    }
    jsonwebtoken_1.default.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = { id: user.id, role: user.role };
        next();
    });
};
exports.authenticateToken = authenticateToken;
const authorizeAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access only' });
    }
    next();
};
exports.authorizeAdmin = authorizeAdmin;
