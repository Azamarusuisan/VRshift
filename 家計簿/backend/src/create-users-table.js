import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_PROJECT_REF = 'uilvmqbfzdrjpwsjlzcj';
const SUPABASE_ACCESS_TOKEN = 'sbp_11b0acfdd613edbfc5ef718d0ee79e705a8f35a7';

const SQL = `
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
`.trim();

async function createUsersTable() {
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: SQL })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ エラー:', data);
      throw new Error(data.message || 'テーブル作成に失敗しました');
    }

    console.log('✅ usersテーブルの作成に成功しました！');
    console.log(data);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

createUsersTable();
