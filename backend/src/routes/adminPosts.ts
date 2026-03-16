import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../db/connection';
import { adminGuard } from '../middleware/authGuard';

const router = Router();

// All routes require admin role
router.use(adminGuard);

// ── GET /api/admin/posts ─────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

// ── POST /api/admin/posts ────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { title, description, external_url, tags, status } = req.body;

  if (!title?.trim()) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  if (status && !['draft', 'published'].includes(status)) {
    res.status(400).json({ error: 'status must be draft or published' });
    return;
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO posts (title, description, external_url, tags, status)
       VALUES (?, ?, ?, ?, ?)`,
      [title.trim(), description ?? null, external_url ?? null, tags ?? null, status ?? 'draft']
    );
    res.status(201).json({ id: result.insertId });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

// ── PUT /api/admin/posts/:id ─────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { title, description, external_url, tags, status } = req.body;

  if (title !== undefined && !title?.trim()) {
    res.status(400).json({ error: 'title cannot be empty' });
    return;
  }
  if (status && !['draft', 'published'].includes(status)) {
    res.status(400).json({ error: 'status must be draft or published' });
    return;
  }

  // Build update dynamically from whichever fields were sent
  const fields: string[] = [];
  const values: unknown[] = [];

  if (title !== undefined)        { fields.push('title = ?');        values.push(title.trim()); }
  if (description !== undefined)  { fields.push('description = ?');  values.push(description ?? null); }
  if (external_url !== undefined) { fields.push('external_url = ?'); values.push(external_url ?? null); }
  if (tags !== undefined)         { fields.push('tags = ?');         values.push(tags ?? null); }
  if (status !== undefined)       { fields.push('status = ?');       values.push(status); }

  if (fields.length === 0) {
    res.status(400).json({ error: 'no fields to update' });
    return;
  }

  values.push(req.params.id);

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'post not found' });
      return;
    }
    res.json({ message: 'updated' });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

// ── DELETE /api/admin/posts/:id ──────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM posts WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'post not found' });
      return;
    }
    res.json({ message: 'deleted' });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

export default router;
