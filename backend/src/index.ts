import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { categoriesRouter } from './routes/categories';
import { transactionsRouter } from './routes/transactions';
import { analyticsRouter } from './routes/analytics';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/analytics', analyticsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
