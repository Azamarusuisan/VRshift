'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types/database'
import { createClient } from '@/utils/supabase/client'

export default function StaffList({ profile }: { profile: Profile }) {
    const [staffMembers, setStaffMembers] = useState<Profile[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            let query = supabase.from('profiles').select('*')

            if (profile.role === 'manager') {
                query = query.eq('manager_id', profile.id)
            }

            const { data } = await query.order('role', { ascending: true })

            if (data) setStaffMembers(data)
        }

        fetchData()
    }, [profile.id, profile.role, supabase])

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-red-50 text-red-700'
            case 'manager': return 'bg-blue-50 text-blue-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メール</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ロール</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">時給</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アポ単価</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {staffMembers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                    スタッフがいません
                                </td>
                            </tr>
                        )}
                        {staffMembers.map(member => (
                            <tr key={member.id}>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.full_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{member.email}</td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadge(member.role)}`}>
                                        {member.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">{member.hourly_rate?.toLocaleString()}円</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{member.appointment_commission?.toLocaleString()}円</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
