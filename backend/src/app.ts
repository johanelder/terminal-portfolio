import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth';
import postsRouter from './routes/posts';
import adminPostsRouter from './routes/adminPosts';
import adminUsersRouter from './routes/adminUsers';

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/admin/posts', adminPostsRouter);
app.use('/api/admin/users', adminUsersRouter);

export default app;
