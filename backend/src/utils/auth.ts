import { Request } from 'express';
import jwt from 'jsonwebtoken';

export type JwtUser = {
  id: string;
  role: string;
};

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  return secret || 'super_secret_jwt_key_for_jlpt_hub_321';
};

export const getAuthTokenFromRequest = (req: Request) => {
  const tokenFromCookie = (req as any).cookies?.token;
  const authHeader = req.headers.authorization;
  const tokenFromHeader = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined;

  return tokenFromCookie || tokenFromHeader || null;
};

export const getUserFromRequest = (req: Request): JwtUser | null => {
  const token = getAuthTokenFromRequest(req);
  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, getJwtSecret());
    return { id: decoded.id, role: decoded.role };
  } catch {
    return null;
  }
};

export const getUserIdFromRequest = (req: Request) => {
  return getUserFromRequest(req)?.id || null;
};
