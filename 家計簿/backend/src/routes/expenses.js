import express from 'express';
import { supabase } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// すべてのルートに認証を適用
router.use(authenticateToken);

// 1. 支出登録
// POST /api/expenses
router.post('/expenses', async (req, res) => {
  try {
    const { spent_at, category, amount, memo } = req.body;

    // バリデーション
    if (!spent_at || !category || !amount) {
      return res.status(400).json({
        error: '必須項目が不足しています',
        required: ['spent_at', 'category', 'amount']
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: '金額は1円以上である必要があります'
      });
    }

    // データベースに挿入
    const { data, error} = await supabase
      .from('expenses')
      .insert([
        {
          user_id: req.user.userId,
          spent_at,
          category,
          amount,
          memo: memo || null
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('支出登録エラー:', error);
    res.status(500).json({
      error: '支出の登録に失敗しました',
      details: error.message
    });
  }
});

// 2. 今月の支出一覧取得
// GET /api/expenses?year=YYYY&month=MM
router.get('/expenses', async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        error: 'year と month のクエリパラメータが必要です',
        example: '/api/expenses?year=2025&month=11'
      });
    }

    // 月の開始日と終了日を計算
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // 月末日

    // データ取得
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', req.user.userId)
      .gte('spent_at', startDate)
      .lte('spent_at', endDate)
      .order('spent_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('支出一覧取得エラー:', error);
    res.status(500).json({
      error: '支出一覧の取得に失敗しました',
      details: error.message
    });
  }
});

// 3. 今月のサマリー（合計 & カテゴリ別）
// GET /api/summary?year=YYYY&month=MM
router.get('/summary', async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        error: 'year と month のクエリパラメータが必要です',
        example: '/api/summary?year=2025&month=11'
      });
    }

    // 月の開始日と終了日を計算
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // データ取得
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', req.user.userId)
      .gte('spent_at', startDate)
      .lte('spent_at', endDate);

    if (error) throw error;

    // 合計計算
    const total = data.reduce((sum, row) => sum + row.amount, 0);

    // カテゴリ別集計
    const categoryMap = {};
    data.forEach(row => {
      if (!categoryMap[row.category]) {
        categoryMap[row.category] = 0;
      }
      categoryMap[row.category] += row.amount;
    });

    const categories = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount
    }));

    res.json({
      total,
      categories
    });
  } catch (error) {
    console.error('サマリー取得エラー:', error);
    res.status(500).json({
      error: 'サマリーの取得に失敗しました',
      details: error.message
    });
  }
});

export default router;
