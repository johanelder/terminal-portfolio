import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authGuard(req: Request, res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'no token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'invalid or expired token' });
  }
}

export function adminGuard(req: Request, res: Response, next: NextFunction): void {
  authGuard(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'admin access required' });
      return;
    }
    next();
  });
}
