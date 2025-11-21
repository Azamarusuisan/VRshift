const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// 認証ヘッダーを取得
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

// 支出を登録
export async function createExpense(expenseData) {
  const response = await fetch(`${API_BASE}/api/expenses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(expenseData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '支出の登録に失敗しました');
  }

  return response.json();
}

// 指定月の支出一覧を取得
export async function getExpenses(year, month) {
  const response = await fetch(
    `${API_BASE}/api/expenses?year=${year}&month=${month}`,
    {
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    throw new Error('支出一覧の取得に失敗しました');
  }

  return response.json();
}

// 指定月のサマリーを取得
export async function getSummary(year, month) {
  const response = await fetch(
    `${API_BASE}/api/summary?year=${year}&month=${month}`,
    {
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    throw new Error('サマリーの取得に失敗しました');
  }

  return response.json();
}
