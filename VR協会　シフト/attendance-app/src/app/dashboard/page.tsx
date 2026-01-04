import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { Profile } from '@/types/database'
import ClockSection from './ClockSection'
import AppointmentSection from './AppointmentSection'

export default async function DashboardPage() {
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
        return <DashboardLayout><div>プロフィールが見つかりません</div></DashboardLayout>
    }

    const userProfile = profile as Profile

    return (
        <DashboardLayout>
            <div className="max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">打刻</h1>
                <div className="space-y-6">
                    <ClockSection profile={userProfile} />
                    {(userProfile.role === 'staff' || userProfile.role === 'manager') && (
                        <AppointmentSection profile={userProfile} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
