import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getAuthTokenFromRequest, getJwtSecret } from '../utils/auth';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = getAuthTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  let secret: string;
  try {
    secret = getJwtSecret();
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server auth configuration error' });
  }

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
