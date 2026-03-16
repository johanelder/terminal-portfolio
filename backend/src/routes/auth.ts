import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import pool from '../db/connection';
import { authGuard } from '../middleware/authGuard';

const router = Router();
const BCRYPT_ROUNDS = 12;

// ── Validation helpers ──────────────────────────────────────────────────────
function isValidUsername(u: string) { return /^[a-zA-Z0-9_]{3,50}$/.test(u); }
function isValidEmail(e: string)    { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function isValidPassword(p: string) { return p.length >= 8; }

// ── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'username, email and password are required' });
    return;
  }
  if (!isValidUsername(username)) {
    res.status(400).json({ error: 'username must be 3–50 characters: letters, numbers, underscores only' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'invalid email format' });
    return;
  }
  if (!isValidPassword(password)) {
    res.status(400).json({ error: 'password must be at least 8 characters' });
    return;
  }

  try {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hash]
    );
    res.status(201).json({ message: 'user created' });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'username or email already exists' });
      return;
    }
    res.status(500).json({ error: 'server error' });
  }
});

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, role, password_hash FROM users WHERE username = ?',
      [username]
    );

    // Same message for "not found" and "wrong password" — prevents user enumeration
    if (rows.length === 0) {
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    res.json({ user: { id: user.id, username: user.username, role: user.role } });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', authGuard, async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [req.user!.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'user not found' });
      return;
    }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

// ── POST /api/auth/logout ───────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  res.json({ message: 'logged out' });
});

export default router;
