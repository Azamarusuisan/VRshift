import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../database.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 会員登録
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // バリデーション
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'すべての項目を入力してください' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'パスワードは6文字以上である必要があります' });
    }

    // メールアドレスの重複チェック
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'このメールアドレスは既に登録されています' });
    }

    // パスワードのハッシュ化
    const password_hash = await bcrypt.hash(password, 10);

    // ユーザー登録
    const { data: user, error } = await supabase
      .from('users')
      .insert([{ email, password_hash, name }])
      .select('id, email, name')
      .single();

    if (error) throw error;

    // JWTトークン生成
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '登録に失敗しました' });
  }
});

// ログイン
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // バリデーション
    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードを入力してください' });
    }

    // ユーザー検索
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが間違っています' });
    }

    // パスワード検証
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'メールアドレスまたはパスワードが間違っています' });
    }

    // JWTトークン生成
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'ログインに失敗しました' });
  }
});

export default router;
