'use client'

import { useState, useEffect } from 'react'
import { Profile, DailyAppointment, AttendanceEvent } from '@/types/database'
import { incrementAppointment } from '@/app/actions/appointments'
import { createClient } from '@/utils/supabase/client'

export default function AppointmentSection({ profile }: { profile: Profile }) {
    const [appointment, setAppointment] = useState<DailyAppointment | null>(null)
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

            const { data: appData } = await supabase
                .from('daily_appointments')
                .select('*')
                .eq('user_id', profile.id)
                .eq('date', today)
                .single()

            if (appData) setAppointment(appData)
        }

        fetchData()
    }, [profile.id, today, supabase])

    const lastEvent = events[events.length - 1]?.type

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

    return (
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
    )
}
