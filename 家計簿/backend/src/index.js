import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './database.js';
import expensesRouter from './routes/expenses.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());

// ルート
app.use('/api/auth', authRouter);
app.use('/api', expensesRouter);

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '家計簿APIサーバー稼働中' });
});

// サーバー起動
app.listen(PORT, async () => {
  console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
  console.log(`📊 API エンドポイント: http://localhost:${PORT}/api`);

  // Supabase 接続テスト
  await testConnection();
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error('サーバーエラー:', err);
  res.status(500).json({
    error: 'サーバー内部エラーが発生しました',
    details: err.message
  });
});
