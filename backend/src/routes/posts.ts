import { Router, Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from '../db/connection';

const router = Router();

// ── GET /api/posts ───────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, description, external_url, tags, created_at
       FROM posts WHERE status = 'published' ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

// ── GET /api/posts/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, description, external_url, tags, created_at
       FROM posts WHERE id = ? AND status = 'published'`,
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'post not found' });
      return;
    }
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

export default router;
