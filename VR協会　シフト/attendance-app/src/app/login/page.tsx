'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Mode = 'login' | 'register'
type Role = 'staff' | 'manager' | 'owner'

export default function LoginPage() {
    const [mode, setMode] = useState<Mode>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<Role>('staff')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!supabase) {
            setError('データベースに接続できません')
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError('ログインに失敗しました。メールアドレスまたはパスワードを確認してください。')
                setLoading(false)
            } else {
                window.location.href = '/'
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error'
            setError(`エラーが発生しました: ${errorMessage}`)
            setLoading(false)
        }
    }


    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        if (!supabase) {
            setError('データベースに接続できません')
            setLoading(false)
            return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                }
            }
        })

        if (signUpError) {
            setError(`登録に失敗しました: ${signUpError.message}`)
            setLoading(false)
            return
        }

        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    email: email,
                    full_name: fullName,
                    role: role,
                })

            if (profileError) {
                console.error('Profile creation error:', profileError)
            }

            setSuccess('登録完了！メールを確認してアカウントを有効化してください。')
            setMode('login')
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-full max-w-md px-4">
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                    <h1 className="text-xl font-medium text-gray-900 text-center mb-2">
                        勤怠・アポ管理システム
                    </h1>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        {mode === 'login' ? 'アカウントにログイン' : '新規アカウント登録'}
                    </p>

                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${mode === 'login'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            ログイン
                        </button>
                        <button
                            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${mode === 'register'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            新規登録
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                            {success}
                        </div>
                    )}

                    {mode === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">パスワード</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-4 py-3 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'ログイン中...' : 'ログイン'}
                            </button>
                        </form>
                    )}

                    {mode === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">名前</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    placeholder="山田 太郎"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">パスワード</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="6文字以上"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">ロール</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as Role)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="staff">スタッフ</option>
                                    <option value="manager">マネージャー</option>
                                    <option value="owner">オーナー</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-4 py-3 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? '登録中...' : '登録する'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
