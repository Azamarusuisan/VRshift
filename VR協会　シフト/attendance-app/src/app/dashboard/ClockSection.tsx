'use client'

import { useState, useEffect } from 'react'
import { Profile, AttendanceEvent } from '@/types/database'
import { clockAction } from '@/app/actions/attendance'
import { createClient } from '@/utils/supabase/client'

export default function ClockSection({ profile }: { profile: Profile }) {
    const [events, setEvents] = useState<AttendanceEvent[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const today = new Date().toISOString().split('T')[0]

    useEffect(() => {
        const fetchData = async () => {
            const { data: eventData } = await supabase
                .from('attendance_events')
                .select('*')
                .eq('user_id', profile.id)
                .gte('timestamp', today + 'T00:00:00')
                .order('timestamp', { ascending: true })

            if (eventData) setEvents(eventData)
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

    const getStatusText = () => {
        if (!lastEvent) return '未出勤'
        if (lastEvent === 'clock_in') return '勤務中'
        if (lastEvent === 'break_start') return '休憩中'
        if (lastEvent === 'break_end') return '勤務中'
        if (lastEvent === 'clock_out') return '退勤済'
        return ''
    }

    return (
        <>
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
        </>
    )
}
