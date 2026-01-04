'use client'

import { useState, useEffect } from 'react'
import { Profile, CorrectionRequest } from '@/types/database'
import { updateCorrectionStatus } from '@/app/actions/corrections'
import { createClient } from '@/utils/supabase/client'

interface CorrectionRequestWithProfile extends CorrectionRequest {
    profiles?: { full_name: string | null }
}

export default function ApprovalsList({ profile }: { profile: Profile }) {
    const [requests, setRequests] = useState<CorrectionRequestWithProfile[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            let query = supabase
                .from('correction_requests')
                .select('*, profiles(full_name)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            // Managers can only see their subordinates' requests
            if (profile.role === 'manager') {
                const { data: subordinates } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('manager_id', profile.id)

                if (subordinates) {
                    query = query.in('user_id', subordinates.map(s => s.id))
                }
            }

            const { data } = await query

            if (data) setRequests(data as CorrectionRequestWithProfile[])
        }

        fetchData()
    }, [profile.id, profile.role, supabase])

    const handleStatus = async (id: string, status: 'approved' | 'rejected') => {
        setLoading(true)
        try {
            await updateCorrectionStatus(id, status)
            window.location.reload()
        } catch {
            alert('エラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">スタッフ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">対象日</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">項目</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">修正後の値</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">理由</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                    承認待ちの申請はありません
                                </td>
                            </tr>
                        )}
                        {requests.map((req) => (
                            <tr key={req.id}>
                                <td className="px-6 py-4 text-sm text-gray-900">{req.profiles?.full_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{req.target_date}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{req.type === 'attendance' ? '勤怠' : 'アポ数'}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{String(req.after_value?.value ?? '')}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{req.reason}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => handleStatus(req.id, 'approved')}
                                        disabled={loading}
                                        className="px-3 py-1 text-sm font-medium text-green-700 bg-green-50 rounded hover:bg-green-100 disabled:opacity-50"
                                    >
                                        承認
                                    </button>
                                    <button
                                        onClick={() => handleStatus(req.id, 'rejected')}
                                        disabled={loading}
                                        className="px-3 py-1 text-sm font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                                    >
                                        却下
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
