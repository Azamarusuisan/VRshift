import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Profile } from '@/types/database'
import ApprovalsList from './ApprovalsList'

export default async function ApprovalsPage() {
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

    if (!profile || profile.role === 'staff') {
        redirect('/dashboard')
    }

    const userProfile = profile as Profile

    return (
        <DashboardLayout>
            <div className="max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">承認管理</h1>
                <ApprovalsList profile={userProfile} />
            </div>
        </DashboardLayout>
    )
}
