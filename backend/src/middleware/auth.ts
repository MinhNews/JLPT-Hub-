import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Read token from HttpOnly cookie first, fallback to Authorization header (for backward compat)
  const tokenFromCookie = req.cookies?.token;
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_for_jlpt_hub_321';
  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = { id: user.id, role: user.role };
    next();
  });
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access only' });
  }
  next();
};
