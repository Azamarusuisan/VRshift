import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'
import { Profile } from '@/types/database'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
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
        <DashboardClient profile={userProfile}>
            {children}
        </DashboardClient>
    )
}
