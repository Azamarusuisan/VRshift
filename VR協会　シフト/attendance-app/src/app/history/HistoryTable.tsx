'use client'

import { useState, useEffect } from 'react'
import { Profile, AttendanceEvent } from '@/types/database'
import { createClient } from '@/utils/supabase/client'

export default function HistoryTable({ profile }: { profile: Profile }) {
    const [events, setEvents] = useState<AttendanceEvent[]>([])
    const [month, setMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const [year, monthNum] = month.split('-').map(Number)
            const startDate = new Date(year, monthNum - 1, 1)
            const endDate = new Date(year, monthNum, 0, 23, 59, 59)

            const { data } = await supabase
                .from('attendance_events')
                .select('*')
                .eq('user_id', profile.id)
                .gte('timestamp', startDate.toISOString())
                .lte('timestamp', endDate.toISOString())
                .order('timestamp', { ascending: false })

            if (data) setEvents(data)
        }

        fetchData()
    }, [profile.id, month, supabase])

    const getEventLabel = (type: string) => {
        switch (type) {
            case 'clock_in': return { label: '出勤', color: 'bg-green-50 text-green-700' }
            case 'clock_out': return { label: '退勤', color: 'bg-red-50 text-red-700' }
            case 'break_start': return { label: '休憩開始', color: 'bg-yellow-50 text-yellow-700' }
            case 'break_end': return { label: '休憩終了', color: 'bg-blue-50 text-blue-700' }
            default: return { label: type, color: 'bg-gray-50 text-gray-700' }
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <label className="text-sm text-gray-700">表示月:</label>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">イベント</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {events.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">
                                        この月の勤怠記録がありません
                                    </td>
                                </tr>
                            )}
                            {events.map(event => {
                                const { label, color } = getEventLabel(event.type)
                                return (
                                    <tr key={event.id}>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {new Date(event.timestamp).toLocaleString('ja-JP')}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${color}`}>
                                                {label}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
