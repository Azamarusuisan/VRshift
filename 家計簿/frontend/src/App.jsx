import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { createExpense, getExpenses, getSummary } from './api';
import Auth from './components/Auth';

// Chart.js の登録
ChartJS.register(ArcElement, Tooltip, Legend);

const LIMIT = 30000; // 上限金額
const CATEGORIES = ['食費', '交際費', '交通費', '趣味', '固定費', 'その他'];

function App() {
  const [user, setUser] = useState(null);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // フォーム入力
  const [formData, setFormData] = useState({
    spent_at: today.toISOString().split('T')[0],
    category: '食費',
    amount: '',
    memo: ''
  });

  // データ取得
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [expensesData, summaryData] = await Promise.all([
        getExpenses(year, month),
        getSummary(year, month)
      ]);
      setExpenses(expensesData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 初回ロード時にログイン状態をチェック
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [year, month, user]);

  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // 未ログインの場合は認証画面を表示
  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  // フォーム送信
  const handleSubmit = async (e) => {
    e.preventDefault();

    // バリデーション
    if (!formData.amount || formData.amount <= 0) {
      alert('金額は1円以上を入力してください');
      return;
    }

    try {
      await createExpense({
        spent_at: formData.spent_at,
        category: formData.category,
        amount: parseInt(formData.amount, 10),
        memo: formData.memo
      });

      // フォームリセット（金額とメモのみ）
      setFormData({
        ...formData,
        amount: '',
        memo: ''
      });

      // データ再取得
      await fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // 3万円超過チェック
  const isOverLimit = summary.total >= LIMIT;

  // グラフデータ
  const chartData = {
    labels: summary.categories.map((c) => c.category),
    datasets: [
      {
        data: summary.categories.map((c) => c.amount),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }
    ]
  };

  return (
    <div className="app">
      {/* ヘッダー */}
      <header className="header">
        <div className="header-top">
          <h1>家計簿（上限3万円）</h1>
          <button className="logout-btn" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
        <div className="header-info">
          {year}年 {month}月 合計：{summary.total.toLocaleString()}円
        </div>
      </header>

      {/* 警告エリア */}
      {isOverLimit && (
        <div className="warning-alert">
          ⚠️ もうお金使ってはいけません！上限3万円を超えています。
        </div>
      )}

      {/* エラー表示 */}
      {error && <div className="error">{error}</div>}

      {/* 支出登録フォーム */}
      <section className="section">
        <h2>支出登録</h2>
        <form className="expense-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="spent_at">日付</label>
            <input
              type="date"
              id="spent_at"
              value={formData.spent_at}
              onChange={(e) =>
                setFormData({ ...formData, spent_at: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">カテゴリ</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="amount">金額（円）</label>
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="1000"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="memo">メモ（任意）</label>
            <input
              type="text"
              id="memo"
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              placeholder="スーパーで買い物"
            />
          </div>

          <button type="submit" disabled={isOverLimit}>
            {isOverLimit ? 'もう登録できません' : '登録する'}
          </button>
        </form>
      </section>

      {/* カテゴリ別円グラフ */}
      <section className="section">
        <h2>カテゴリ別支出</h2>
        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : summary.categories.length > 0 ? (
          <div className="chart-container">
            <Pie data={chartData} />
          </div>
        ) : (
          <div className="no-data">まだデータがありません。</div>
        )}
      </section>

      {/* 今月の支出一覧 */}
      <section className="section">
        <h2>今月の支出一覧</h2>
        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : expenses.length > 0 ? (
          <ul className="expense-list">
            {expenses.map((expense) => (
              <li key={expense.id} className="expense-item">
                <div className="expense-info">
                  <span className="expense-date">{expense.spent_at}</span>
                  <span className="expense-category">{expense.category}</span>
                  <span className="expense-amount">
                    {expense.amount.toLocaleString()}円
                  </span>
                  {expense.memo && (
                    <span className="expense-memo">/ {expense.memo}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-data">まだデータがありません。</div>
        )}
      </section>
    </div>
  );
}

export default App;
