import { supabase } from './database.js';

async function setupDatabase() {
  console.log('📦 データベースセットアップを開始します...\n');

  try {
    // 1. expenses テーブルの作成
    console.log('1️⃣ expenses テーブルを作成中...');

    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.expenses (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL DEFAULT 'me',
          spent_at DATE NOT NULL,
          category TEXT NOT NULL,
          amount INTEGER NOT NULL,
          memo TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });

    // 上記のRPC方式が使えない場合は、直接SQL実行
    // Supabaseクライアントでは通常、テーブル作成はダッシュボードかpostgREST経由で行う
    // そのため、代替方法として raw SQL を実行

    // 実際には、Supabaseクライアントライブラリでは CREATE TABLE を直接実行できないため、
    // 以下のアプローチを使用します

    console.log('   ⚠️ Supabaseクライアントでは直接CREATE TABLEを実行できません');
    console.log('   📝 以下のSQLをSupabaseダッシュボードのSQL Editorで実行してください:\n');

    const setupSQL = `
-- expenses テーブルの作成
CREATE TABLE IF NOT EXISTS public.expenses (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'me',
  spent_at DATE NOT NULL,
  category TEXT NOT NULL,
  amount INTEGER NOT NULL,
  memo TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_expenses_user_spent
  ON public.expenses(user_id, spent_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_category
  ON public.expenses(category);

-- コメント追加
COMMENT ON TABLE public.expenses IS '家計簿の支出データ';
COMMENT ON COLUMN public.expenses.user_id IS '単一ユーザー前提で常に "me"。将来のマルチユーザー拡張用';
COMMENT ON COLUMN public.expenses.spent_at IS '支出日';
COMMENT ON COLUMN public.expenses.category IS 'カテゴリ（食費/交際費/交通費/趣味/固定費/その他）';
COMMENT ON COLUMN public.expenses.amount IS '金額（円）';
COMMENT ON COLUMN public.expenses.memo IS 'メモ（任意）';
    `.trim();

    console.log('━'.repeat(80));
    console.log(setupSQL);
    console.log('━'.repeat(80));
    console.log('\n');

    // 2. テーブルが存在するか確認
    console.log('2️⃣ テーブルの存在確認...');
    const { data: tables, error: checkError } = await supabase
      .from('expenses')
      .select('id')
      .limit(1);

    if (checkError) {
      if (checkError.code === '42P01') {
        console.log('   ❌ テーブルがまだ存在しません');
        console.log('   👆 上記のSQLをSupabaseダッシュボードで実行してください\n');
        console.log('   📍 手順:');
        console.log('      1. https://supabase.com/dashboard にアクセス');
        console.log('      2. プロジェクト "nano" を選択');
        console.log('      3. 左サイドバーの "SQL Editor" をクリック');
        console.log('      4. 上記のSQLを貼り付けて "Run" をクリック');
        process.exit(1);
      } else {
        throw checkError;
      }
    } else {
      console.log('   ✅ テーブルが存在します');
    }

    // 3. テストデータの挿入（オプション）
    console.log('\n3️⃣ テストデータを挿入しますか？');
    console.log('   スキップするには Ctrl+C を押してください（5秒待機）...');

    await new Promise(resolve => setTimeout(resolve, 5000));

    const testData = [
      {
        user_id: 'me',
        spent_at: new Date().toISOString().split('T')[0],
        category: '食費',
        amount: 3500,
        memo: 'スーパーで買い物'
      },
      {
        user_id: 'me',
        spent_at: new Date().toISOString().split('T')[0],
        category: '交通費',
        amount: 1200,
        memo: '電車代'
      },
      {
        user_id: 'me',
        spent_at: new Date().toISOString().split('T')[0],
        category: '趣味',
        amount: 5000,
        memo: '本購入'
      }
    ];

    const { data: inserted, error: insertError } = await supabase
      .from('expenses')
      .insert(testData)
      .select();

    if (insertError) throw insertError;

    console.log(`   ✅ テストデータを ${inserted.length} 件挿入しました`);
    inserted.forEach(item => {
      console.log(`      - ${item.spent_at} / ${item.category} / ${item.amount}円`);
    });

    console.log('\n🎉 セットアップ完了！\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

setupDatabase();
