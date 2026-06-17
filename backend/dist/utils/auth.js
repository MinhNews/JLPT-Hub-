"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserIdFromRequest = exports.getUserFromRequest = exports.getAuthTokenFromRequest = exports.getJwtSecret = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required in production');
    }
    return secret || 'super_secret_jwt_key_for_jlpt_hub_321';
};
exports.getJwtSecret = getJwtSecret;
const getAuthTokenFromRequest = (req) => {
    const tokenFromCookie = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : undefined;
    return tokenFromCookie || tokenFromHeader || null;
};
exports.getAuthTokenFromRequest = getAuthTokenFromRequest;
const getUserFromRequest = (req) => {
    const token = (0, exports.getAuthTokenFromRequest)(req);
    if (!token)
        return null;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, (0, exports.getJwtSecret)());
        return { id: decoded.id, role: decoded.role };
    }
    catch {
        return null;
    }
};
exports.getUserFromRequest = getUserFromRequest;
const getUserIdFromRequest = (req) => {
    return (0, exports.getUserFromRequest)(req)?.id || null;
};
exports.getUserIdFromRequest = getUserIdFromRequest;
