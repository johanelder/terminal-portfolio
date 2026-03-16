import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import pool from '../src/db/connection';

const ADMIN = { username: 'adminuser', email: 'admin@example.com', password: 'password123' };

async function getAdminCookie(): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({
    username: ADMIN.username,
    password: ADMIN.password,
  });
  return (res.headers['set-cookie'] as unknown as string[])[0];
}

beforeAll(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      username      VARCHAR(50)  NOT NULL UNIQUE,
      email         VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role          ENUM('guest', 'user', 'admin') DEFAULT 'user',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      title        VARCHAR(150) NOT NULL,
      description  TEXT,
      external_url VARCHAR(500),
      tags         VARCHAR(255),
      status       ENUM('draft', 'published') DEFAULT 'draft',
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  const hash = await bcrypt.hash(ADMIN.password, 12);
  await pool.query(
    `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')`,
    [ADMIN.username, ADMIN.email, hash]
  );
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS posts');
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.end();
});

beforeEach(async () => {
  await pool.query('DELETE FROM posts');
});

// ── Public: GET /api/posts ───────────────────────────────────────────────────
describe('GET /api/posts', () => {
  it('returns only published posts', async () => {
    await pool.query(`INSERT INTO posts (title, status) VALUES ('Published', 'published'), ('Draft', 'draft')`);
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Published');
  });

  it('returns empty array when no posts', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ── Public: GET /api/posts/:id ───────────────────────────────────────────────
describe('GET /api/posts/:id', () => {
  it('returns a published post by id', async () => {
    const [result] = await pool.query<import('mysql2').ResultSetHeader>(
      `INSERT INTO posts (title, status) VALUES ('My Post', 'published')`
    );
    const res = await request(app).get(`/api/posts/${result.insertId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('My Post');
  });

  it('returns 404 for draft post', async () => {
    const [result] = await pool.query<import('mysql2').ResultSetHeader>(
      `INSERT INTO posts (title, status) VALUES ('Hidden', 'draft')`
    );
    const res = await request(app).get(`/api/posts/${result.insertId}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent post', async () => {
    const res = await request(app).get('/api/posts/99999');
    expect(res.status).toBe(404);
  });
});

// ── Admin: GET /api/admin/posts ──────────────────────────────────────────────
describe('GET /api/admin/posts', () => {
  it('returns all posts including drafts', async () => {
    await pool.query(`INSERT INTO posts (title, status) VALUES ('Published', 'published'), ('Draft', 'draft')`);
    const cookie = await getAdminCookie();
    const res = await request(app).get('/api/admin/posts').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/admin/posts');
    expect(res.status).toBe(401);
  });
});

// ── Admin: POST /api/admin/posts ─────────────────────────────────────────────
describe('POST /api/admin/posts', () => {
  it('creates a post and returns its id', async () => {
    const cookie = await getAdminCookie();
    const res = await request(app)
      .post('/api/admin/posts')
      .set('Cookie', cookie)
      .send({ title: 'New Post', status: 'draft' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('returns 400 when title is missing', async () => {
    const cookie = await getAdminCookie();
    const res = await request(app)
      .post('/api/admin/posts')
      .set('Cookie', cookie)
      .send({ description: 'no title' });
    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/admin/posts').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });
});

// ── Admin: PUT /api/admin/posts/:id ─────────────────────────────────────────
describe('PUT /api/admin/posts/:id', () => {
  it('updates a post', async () => {
    const cookie = await getAdminCookie();
    const createRes = await request(app)
      .post('/api/admin/posts')
      .set('Cookie', cookie)
      .send({ title: 'Original', status: 'draft' });
    const id = createRes.body.id;

    const res = await request(app)
      .put(`/api/admin/posts/${id}`)
      .set('Cookie', cookie)
      .send({ title: 'Updated', status: 'published' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('updated');
  });

  it('returns 404 for non-existent post', async () => {
    const cookie = await getAdminCookie();
    const res = await request(app)
      .put('/api/admin/posts/99999')
      .set('Cookie', cookie)
      .send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

// ── Admin: DELETE /api/admin/posts/:id ───────────────────────────────────────
describe('DELETE /api/admin/posts/:id', () => {
  it('deletes a post', async () => {
    const cookie = await getAdminCookie();
    const createRes = await request(app)
      .post('/api/admin/posts')
      .set('Cookie', cookie)
      .send({ title: 'To Delete', status: 'draft' });
    const id = createRes.body.id;

    const res = await request(app)
      .delete(`/api/admin/posts/${id}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('deleted');
  });

  it('returns 404 for non-existent post', async () => {
    const cookie = await getAdminCookie();
    const res = await request(app).delete('/api/admin/posts/99999').set('Cookie', cookie);
    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).delete('/api/admin/posts/1');
    expect(res.status).toBe(401);
  });
});
