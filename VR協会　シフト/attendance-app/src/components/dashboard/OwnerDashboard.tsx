'use client'

import { useState, useEffect } from 'react'
import { Profile, CorrectionRequest } from '@/types/database'
import { createClient } from '@/utils/supabase/client'

interface AttendanceHistoryItem {
    id: string
    user_id: string
    type: string
    timestamp: string
    profiles?: { full_name: string | null }
}

interface CorrectionRequestWithProfile extends CorrectionRequest {
    profiles?: { full_name: string | null }
}

export default function OwnerDashboard() {
    const [allProfiles, setAllProfiles] = useState<Profile[]>([])
    const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryItem[]>([])
    const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequestWithProfile[]>([])
    const [activeTab, setActiveTab] = useState<'summary' | 'history' | 'monthly' | 'requests'>('summary')
    const supabase = createClient()

    useEffect(() => {
        if (!supabase) return
        const fetchData = async () => {
            // Fetch all profiles
            const { data: profilesData } = await supabase.from('profiles').select('*')
            if (profilesData) setAllProfiles(profilesData)

            // Fetch recent attendance events
            const { data: eventsData } = await supabase
                .from('attendance_events')
                .select('*, profiles(full_name)')
                .order('timestamp', { ascending: false })
                .limit(50)
            if (eventsData) setAttendanceHistory(eventsData)

            // Fetch correction requests
            const { data: requestsData } = await supabase
                .from('correction_requests')
                .select('*, profiles(full_name)')
                .order('created_at', { ascending: false })
            if (requestsData) setCorrectionRequests(requestsData as CorrectionRequestWithProfile[])
        }

        fetchData()
    }, [supabase])

    const tabs = [
        { id: 'summary', label: '概要' },
        { id: 'history', label: '勤怠履歴' },
        { id: 'monthly', label: '月次集計' },
        { id: 'requests', label: '修正申請' },
    ]

    const todayAttendance = attendanceHistory.filter(e =>
        new Date(e.timestamp).toDateString() === new Date().toDateString()
    )

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'summary' | 'history' | 'monthly' | 'requests')}
                            className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'summary' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="text-sm text-gray-500 mb-1">総従業員数</div>
                            <div className="text-2xl font-medium text-gray-900">{allProfiles.length} 名</div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="text-sm text-gray-500 mb-1">本日出勤</div>
                            <div className="text-2xl font-medium text-gray-900">
                                {new Set(todayAttendance.filter(e => e.type === 'clock_in').map(e => e.user_id)).size} 名
                            </div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="text-sm text-gray-500 mb-1">本日の総アポ数</div>
                            <div className="text-2xl font-medium text-gray-900">--</div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="text-sm text-gray-500 mb-1">承認待ち</div>
                            <div className="text-2xl font-medium text-gray-900">
                                {correctionRequests.filter(r => r.status === 'pending').length} 件
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-base font-medium text-gray-900">従業員・給与設定</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ロール</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">時給</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アポ単価</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">直属マネージャー</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {allProfiles.map(p => (
                                        <tr key={p.id}>
                                            <td className="px-6 py-4 text-sm text-gray-900">{p.full_name}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${p.role === 'owner' ? 'bg-red-50 text-red-700' :
                                                    p.role === 'manager' ? 'bg-blue-50 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {p.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{p.hourly_rate?.toLocaleString()}円</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{p.appointment_commission?.toLocaleString()}円</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {allProfiles.find(m => m.id === p.manager_id)?.full_name || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-base font-medium text-gray-900">勤怠履歴</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">スタッフ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">イベント</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {attendanceHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">勤怠記録がありません</td>
                                    </tr>
                                )}
                                {attendanceHistory.map(row => (
                                    <tr key={row.id}>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {new Date(row.timestamp).toLocaleString('ja-JP')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{row.profiles?.full_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {row.type === 'clock_in' ? '出勤' :
                                                row.type === 'clock_out' ? '退勤' :
                                                    row.type === 'break_start' ? '休憩開始' : '休憩終了'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'monthly' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-sm text-gray-500">月次集計機能は今後実装予定です</p>
                </div>
            )}

            {activeTab === 'requests' && (
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-base font-medium text-gray-900">修正申請一覧</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">スタッフ</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">対象日</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">項目</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">理由</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {correctionRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">修正申請がありません</td>
                                    </tr>
                                )}
                                {correctionRequests.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-6 py-4 text-sm text-gray-900">{row.profiles?.full_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{row.target_date}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{row.type === 'attendance' ? '勤怠' : 'アポ数'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{row.reason}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${row.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                                row.status === 'approved' ? 'bg-green-50 text-green-700' :
                                                    'bg-red-50 text-red-700'
                                                }`}>
                                                {row.status === 'pending' ? '承認待ち' :
                                                    row.status === 'approved' ? '承認済' : '却下'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
