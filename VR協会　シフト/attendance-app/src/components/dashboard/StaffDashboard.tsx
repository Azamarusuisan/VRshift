'use client'

import { useState, useEffect } from 'react'
import { Profile, AttendanceEvent, DailyAppointment } from '@/types/database'
import { clockAction } from '@/app/actions/attendance'
import { incrementAppointment } from '@/app/actions/appointments'
import { submitCorrectionRequest } from '@/app/actions/corrections'
import { createClient } from '@/utils/supabase/client'

export default function StaffDashboard({ profile }: { profile: Profile }) {
    const [events, setEvents] = useState<AttendanceEvent[]>([])
    const [attendanceHistory, setAttendanceHistory] = useState<AttendanceEvent[]>([])
    const [appointment, setAppointment] = useState<DailyAppointment | null>(null)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const today = new Date().toISOString().split('T')[0]

    useEffect(() => {
        if (!supabase) return
        const fetchData = async () => {
            const { data: eventData } = await supabase
                .from('attendance_events')
                .select('*')
                .eq('user_id', profile.id)
                .gte('timestamp', today + 'T00:00:00')
                .order('timestamp', { ascending: true })

            if (eventData) setEvents(eventData)

            const { data: appData } = await supabase
                .from('daily_appointments')
                .select('*')
                .eq('user_id', profile.id)
                .eq('date', today)
                .single()

            if (appData) setAppointment(appData)

            // Fetch past 7 days attendance history
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            const { data: historyData } = await supabase
                .from('attendance_events')
                .select('*')
                .eq('user_id', profile.id)
                .gte('timestamp', sevenDaysAgo.toISOString())
                .order('timestamp', { ascending: false })

            if (historyData) setAttendanceHistory(historyData)
        }

        fetchData()
    }, [profile.id, today, supabase])

    const lastEvent = events[events.length - 1]?.type

    const handleClock = async (type: 'clock_in' | 'break_start' | 'break_end' | 'clock_out') => {
        setLoading(true)
        try {
            await clockAction(type)
            window.location.reload()
        } catch {
            alert('エラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    const handleIncrement = async () => {
        setLoading(true)
        try {
            await incrementAppointment()
            window.location.reload()
        } catch {
            alert('エラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    const getStatusText = () => {
        if (!lastEvent) return '未出勤'
        if (lastEvent === 'clock_in') return '勤務中'
        if (lastEvent === 'break_start') return '休憩中'
        if (lastEvent === 'break_end') return '勤務中'
        if (lastEvent === 'clock_out') return '退勤済'
        return ''
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="text-sm text-gray-500 mb-1">現在のステータス</div>
                <div className="text-2xl font-medium text-gray-900">{getStatusText()}</div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-base font-medium text-gray-900 mb-4">勤怠打刻</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                        onClick={() => handleClock('clock_in')}
                        disabled={!!lastEvent || loading}
                        className="px-4 py-3 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        出勤
                    </button>
                    <button
                        onClick={() => handleClock('break_start')}
                        disabled={lastEvent !== 'clock_in' || loading}
                        className="px-4 py-3 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        休憩開始
                    </button>
                    <button
                        onClick={() => handleClock('break_end')}
                        disabled={lastEvent !== 'break_start' || loading}
                        className="px-4 py-3 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        休憩終了
                    </button>
                    <button
                        onClick={() => handleClock('clock_out')}
                        disabled={(lastEvent !== 'clock_in' && lastEvent !== 'break_end') || loading}
                        className="px-4 py-3 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        退勤
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-base font-medium text-gray-900 mb-4">本日のアポ獲得数</h2>
                <div className="flex items-center gap-6">
                    <div className="text-4xl font-medium text-gray-900">
                        {appointment?.count || 0}
                    </div>
                    <button
                        onClick={handleIncrement}
                        disabled={loading || lastEvent === 'clock_out' || !lastEvent}
                        className="px-6 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        アポ獲得
                    </button>
                </div>
                <p className="mt-3 text-sm text-gray-500">退勤後は更新できません</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-base font-medium text-gray-900 mb-4">修正申請</h2>
                <form action={submitCorrectionRequest} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">対象日</label>
                            <input
                                name="target_date"
                                type="date"
                                required
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">項目</label>
                            <select
                                name="type"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="attendance">勤怠</option>
                                <option value="appointment">アポ数</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">修正後の値</label>
                            <input
                                name="after_value"
                                type="text"
                                placeholder="例: 5"
                                required
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">理由</label>
                            <input
                                name="reason"
                                type="text"
                                placeholder="打刻忘れのため"
                                required
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                        申請を送信
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-medium text-gray-900">勤怠履歴（過去7日間）</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">イベント</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {attendanceHistory.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">勤怠記録がありません</td>
                                </tr>
                            )}
                            {attendanceHistory.map(row => (
                                <tr key={row.id}>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {new Date(row.timestamp).toLocaleString('ja-JP')}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${row.type === 'clock_in' ? 'bg-green-50 text-green-700' :
                                                row.type === 'clock_out' ? 'bg-red-50 text-red-700' :
                                                    row.type === 'break_start' ? 'bg-yellow-50 text-yellow-700' :
                                                        'bg-blue-50 text-blue-700'
                                            }`}>
                                            {row.type === 'clock_in' ? '出勤' :
                                                row.type === 'clock_out' ? '退勤' :
                                                    row.type === 'break_start' ? '休憩開始' : '休憩終了'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
