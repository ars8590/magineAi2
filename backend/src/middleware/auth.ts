import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing Authorization header' });
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { role: string };
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    res.locals.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing Authorization header' });
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { role: string; sub: string };
    if (payload.role === 'admin') {
      res.locals.admin = payload;
    } else if (payload.role === 'user') {
      res.locals.user = { id: payload.sub };
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  } catch (err) {
    console.error('Core Auth Verification Failed:', err);
    console.log('Token received:', token.substring(0, 20) + '...');
    return res.status(401).json({ message: 'Invalid token' });
  }
}

