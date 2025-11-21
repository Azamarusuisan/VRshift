import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    '環境変数が設定されていません。SUPABASE_URL と SUPABASE_SERVICE_KEY を .env に設定してください。'
  );
}

// Supabase クライアントの初期化（サービスロールキー使用）
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 接続テスト用関数
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('count')
      .limit(1);

    if (error) throw error;

    console.log('✅ Supabase 接続成功');
    return true;
  } catch (error) {
    console.error('❌ Supabase 接続エラー:', error.message);
    return false;
  }
}
