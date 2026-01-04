import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
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
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar profile={userProfile} />
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    )
}
