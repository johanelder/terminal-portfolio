import { Router, Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../db/connection';
import { adminGuard } from '../middleware/authGuard';

const router = Router();

// All routes require admin role
router.use(adminGuard);

// ── GET /api/admin/users ──────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at ASC'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

// ── PUT /api/admin/users/:id ──────────────────────────────────────────────────
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { role } = req.body;

  if (!role || !['guest', 'user', 'admin'].includes(role)) {
    res.status(400).json({ error: 'role must be guest, user, or admin' });
    return;
  }

  // Prevent admin from demoting themselves
  if (req.user && String(req.user.id) === req.params.id) {
    res.status(400).json({ error: 'cannot change your own role' });
    return;
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'user not found' });
      return;
    }
    res.json({ message: 'updated' });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  // Prevent admin from deleting themselves
  if (req.user && String(req.user.id) === req.params.id) {
    res.status(400).json({ error: 'cannot delete your own account' });
    return;
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'user not found' });
      return;
    }
    res.json({ message: 'deleted' });
  } catch {
    res.status(500).json({ error: 'server error' });
  }
});

export default router;
