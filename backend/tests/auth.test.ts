import request from 'supertest';
import app from '../src/app';
import pool from '../src/db/connection';

const USER = {
  username: 'testuser',
  email:    'test@example.com',
  password: 'password123',
};

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
});

afterAll(async () => {
  await pool.query('DROP TABLE IF EXISTS users');
  await pool.end();
});

beforeEach(async () => {
  await pool.query('DELETE FROM users');
});

// ── Register ────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('creates a user and returns 201', async () => {
    const res = await request(app).post('/api/auth/register').send(USER);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('user created');
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'only' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid username', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...USER, username: 'a!' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...USER, email: 'notanemail' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...USER, password: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate username', async () => {
    await request(app).post('/api/auth/register').send(USER);
    const res = await request(app).post('/api/auth/register').send(USER);
    expect(res.status).toBe(409);
  });

  it('returns 409 on duplicate email', async () => {
    await request(app).post('/api/auth/register').send(USER);
    const res = await request(app).post('/api/auth/register').send({ ...USER, username: 'other' });
    expect(res.status).toBe(409);
  });
});

// ── Login ────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(USER);
  });

  it('returns token and user on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: USER.username,
      password: USER.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe(USER.username);
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: USER.username });
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: USER.username,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'nobody',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

// ── Me ───────────────────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  let token: string;

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(USER);
    const res = await request(app).post('/api/auth/login').send({
      username: USER.username,
      password: USER.password,
    });
    token = res.body.token;
  });

  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(USER.username);
    expect(res.body.password_hash).toBeUndefined();
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer notavalidtoken');
    expect(res.status).toBe(401);
  });
});

// ── Logout ───────────────────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
  it('returns 200', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
  });
});
