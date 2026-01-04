import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import CorrectionForm from './CorrectionForm'

export default async function CorrectionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">修正申請</h1>
                <CorrectionForm />
            </div>
        </DashboardLayout>
    )
}
