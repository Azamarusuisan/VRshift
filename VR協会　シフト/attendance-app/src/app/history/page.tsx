import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Profile } from '@/types/database'
import HistoryTable from './HistoryTable'

export default async function HistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    const userProfile = profile as Profile

    return (
        <DashboardLayout>
            <div className="max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">勤怠履歴</h1>
                <HistoryTable profile={userProfile} />
            </div>
        </DashboardLayout>
    )
}
