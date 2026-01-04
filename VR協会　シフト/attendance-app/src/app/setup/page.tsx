'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

type SetupStep = 'checking' | 'need-tables' | 'need-users' | 'ready' | 'error'

export default function SetupPage() {
    const [step, setStep] = useState<SetupStep>('checking')
    const [message, setMessage] = useState('データベースの状態を確認中...')
    const [loading, setLoading] = useState(false)
    const [recheckTrigger, setRecheckTrigger] = useState(0)
    const isFirstRender = useRef(true)

    useEffect(() => {
        const checkDatabase = async () => {
            const url = process.env.NEXT_PUBLIC_SUPABASE_URL
            const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            if (!url || !key) {
                setStep('error')
                setMessage('環境変数が設定されていません')
                return
            }

            const supabase = createClient(url, key)

            // Check if profiles table exists
            const { data, error } = await supabase.from('profiles').select('id').limit(1)

            if (error && error.code === '42P01') {
                setStep('need-tables')
                setMessage('テーブルが未作成です。SQLを実行してください。')
            } else if (error) {
                setStep('error')
                setMessage(`エラー: ${error.message}`)
            } else if (!data || data.length === 0) {
                setStep('need-users')
                setMessage('テーブルは作成済みです。テストユーザーを作成してください。')
            } else {
                setStep('ready')
                setMessage('セットアップ完了！ログインできます。')
            }
        }

        if (isFirstRender.current || recheckTrigger > 0) {
            isFirstRender.current = false
            checkDatabase()
        }
    }, [recheckTrigger])

    const handleRecheck = () => {
        setStep('checking')
        setMessage('データベースの状態を確認中...')
        setRecheckTrigger(prev => prev + 1)
    }

    const createTestUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/seed-users', { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setStep('ready')
                setMessage('テストユーザーを作成しました！')
            } else {
                setMessage(`エラー: ${data.error}`)
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error'
            setMessage(`エラー: ${errorMessage}`)
        }
        setLoading(false)
    }

    const sqlCode = `-- テーブル作成（コピーしてSupabase SQL Editorに貼り付け）
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'staff',
    manager_id UUID,
    hourly_rate NUMERIC DEFAULT 0,
    appointment_commission NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.attendance_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.daily_appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    count INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

CREATE TABLE public.correction_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    target_date DATE NOT NULL,
    type TEXT NOT NULL,
    before_value JSONB,
    after_value JSONB,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMPTZ
);

-- RLS有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correction_requests ENABLE ROW LEVEL SECURITY;

-- ポリシー（全アクセス許可 - 開発用）
CREATE POLICY "all_access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON public.attendance_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON public.daily_appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_access" ON public.correction_requests FOR ALL USING (true) WITH CHECK (true);`

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                    <h1 className="text-xl font-medium text-gray-900 mb-6">データベースセットアップ</h1>

                    {/* ステータス表示 */}
                    <div className={`p-4 rounded-lg mb-6 ${step === 'ready' ? 'bg-green-50 border border-green-200' :
                        step === 'error' ? 'bg-red-50 border border-red-200' :
                            'bg-blue-50 border border-blue-200'
                        }`}>
                        <p className={`text-sm font-medium ${step === 'ready' ? 'text-green-700' :
                            step === 'error' ? 'text-red-700' :
                                'text-blue-700'
                            }`}>
                            {message}
                        </p>
                    </div>

                    {/* ステップ1: テーブル作成 */}
                    {step === 'need-tables' && (
                        <div className="space-y-4 mb-6">
                            <h2 className="text-base font-medium text-gray-900">ステップ1: テーブル作成</h2>
                            <p className="text-sm text-gray-600">
                                以下のSQLをコピーして、Supabase DashboardのSQL Editorで実行してください。
                            </p>
                            <div className="relative">
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
                                    {sqlCode}
                                </pre>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(sqlCode)
                                        alert('SQLをコピーしました！')
                                    }}
                                    className="absolute top-2 right-2 px-3 py-1 text-xs font-medium rounded bg-gray-700 text-white hover:bg-gray-600"
                                >
                                    コピー
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <a
                                    href="https://supabase.com/dashboard/project/otnhqzacieyzpqdbihch/sql/new"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    SQL Editorを開く
                                </a>
                                <button
                                    onClick={handleRecheck}
                                    className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                >
                                    再確認
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ステップ2: テストユーザー作成 */}
                    {step === 'need-users' && (
                        <div className="space-y-4 mb-6">
                            <h2 className="text-base font-medium text-gray-900">ステップ2: テストユーザー作成</h2>
                            <p className="text-sm text-gray-600">
                                ボタンをクリックして、3つのロール用のテストユーザーを作成します。
                            </p>
                            <button
                                onClick={createTestUsers}
                                disabled={loading}
                                className="px-6 py-3 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? '作成中...' : 'テストユーザーを作成'}
                            </button>
                        </div>
                    )}

                    {/* 完了: テストアカウント情報 */}
                    {step === 'ready' && (
                        <div className="space-y-4">
                            <h2 className="text-base font-medium text-gray-900">テストアカウント</h2>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500">
                                            <th className="pb-2">ロール</th>
                                            <th className="pb-2">メール</th>
                                            <th className="pb-2">パスワード</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-900">
                                        <tr><td className="py-1">オーナー</td><td>owner@test.com</td><td>test1234</td></tr>
                                        <tr><td className="py-1">マネージャー</td><td>manager@test.com</td><td>test1234</td></tr>
                                        <tr><td className="py-1">スタッフ</td><td>staff@test.com</td><td>test1234</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <a
                                href="/login"
                                className="inline-block px-6 py-3 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            >
                                ログイン画面へ
                            </a>
                        </div>
                    )}

                    {step === 'error' && (
                        <button
                            onClick={handleRecheck}
                            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        >
                            再確認
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
