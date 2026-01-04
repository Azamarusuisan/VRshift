'use client'

import { useState, useEffect } from 'react'
import { Profile, AttendanceEvent, DailyAppointment } from '@/types/database'
import { createClient } from '@/utils/supabase/client'

interface DailySummary {
    date: string
    workMinutes: number
    breakMinutes: number
    appointments: number
}

export default function MonthlySummary({ profile }: { profile: Profile }) {
    const [summaries, setSummaries] = useState<DailySummary[]>([])
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

            // Fetch attendance events
            const { data: events } = await supabase
                .from('attendance_events')
                .select('*')
                .eq('user_id', profile.id)
                .gte('timestamp', startDate.toISOString())
                .lte('timestamp', endDate.toISOString())
                .order('timestamp', { ascending: true })

            // Fetch appointments
            const { data: appointments } = await supabase
                .from('daily_appointments')
                .select('*')
                .eq('user_id', profile.id)
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0])

            // Group events by date and calculate work time
            const dailyData: { [date: string]: DailySummary } = {}

            if (events) {
                events.forEach((event: AttendanceEvent) => {
                    const date = event.timestamp.split('T')[0]
                    if (!dailyData[date]) {
                        dailyData[date] = { date, workMinutes: 0, breakMinutes: 0, appointments: 0 }
                    }
                })

                // Calculate work and break time
                for (const date of Object.keys(dailyData)) {
                    const dayEvents = events.filter((e: AttendanceEvent) => e.timestamp.startsWith(date))
                    let workStart: Date | null = null
                    let breakStart: Date | null = null
                    let totalWork = 0
                    let totalBreak = 0

                    dayEvents.forEach((event: AttendanceEvent) => {
                        const time = new Date(event.timestamp)
                        switch (event.type) {
                            case 'clock_in':
                                workStart = time
                                break
                            case 'break_start':
                                breakStart = time
                                break
                            case 'break_end':
                                if (breakStart) {
                                    totalBreak += (time.getTime() - breakStart.getTime()) / 60000
                                    breakStart = null
                                }
                                break
                            case 'clock_out':
                                if (workStart) {
                                    totalWork += (time.getTime() - workStart.getTime()) / 60000
                                    workStart = null
                                }
                                break
                        }
                    })

                    dailyData[date].workMinutes = Math.round(totalWork - totalBreak)
                    dailyData[date].breakMinutes = Math.round(totalBreak)
                }
            }

            if (appointments) {
                appointments.forEach((app: DailyAppointment) => {
                    if (dailyData[app.date]) {
                        dailyData[app.date].appointments = app.count
                    } else {
                        dailyData[app.date] = { date: app.date, workMinutes: 0, breakMinutes: 0, appointments: app.count }
                    }
                })
            }

            setSummaries(Object.values(dailyData).sort((a, b) => b.date.localeCompare(a.date)))
        }

        fetchData()
    }, [profile.id, month, supabase])

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}時間${mins}分`
    }

    const totalWorkMinutes = summaries.reduce((sum, s) => sum + s.workMinutes, 0)
    const totalAppointments = summaries.reduce((sum, s) => sum + s.appointments, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <label className="text-sm text-gray-700">表示月:</label>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-sm text-gray-500 mb-1">合計勤務時間</div>
                    <div className="text-2xl font-medium text-gray-900">{formatMinutes(totalWorkMinutes)}</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-sm text-gray-500 mb-1">出勤日数</div>
                    <div className="text-2xl font-medium text-gray-900">{summaries.filter(s => s.workMinutes > 0).length}日</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-sm text-gray-500 mb-1">合計アポ獲得</div>
                    <div className="text-2xl font-medium text-gray-900">{totalAppointments}件</div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">勤務時間</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">休憩時間</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アポ数</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {summaries.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                                        この月のデータがありません
                                    </td>
                                </tr>
                            )}
                            {summaries.map(summary => (
                                <tr key={summary.date}>
                                    <td className="px-6 py-4 text-sm text-gray-900">{summary.date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{formatMinutes(summary.workMinutes)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{formatMinutes(summary.breakMinutes)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{summary.appointments}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
