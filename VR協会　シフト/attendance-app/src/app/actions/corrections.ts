'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { CorrectionType } from '@/types/database'

export async function submitCorrectionRequest(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('認証が必要です')

    const target_date = formData.get('target_date') as string
    const type = formData.get('type') as CorrectionType
    const after_value = formData.get('after_value') as string
    const reason = formData.get('reason') as string

    const { error } = await supabase
        .from('correction_requests')
        .insert({
            user_id: user.id,
            target_date,
            type,
            after_value: { value: after_value },
            reason,
            status: 'pending',
        })

    if (error) {
        console.error('Correction request error:', error)
        throw new Error('修正申請に失敗しました')
    }

    revalidatePath('/')
}

export async function updateCorrectionStatus(id: string, status: 'approved' | 'rejected') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('認証が必要です')

    const { error } = await supabase
        .from('correction_requests')
        .update({
            status,
            approved_by: user.id,
            approved_at: new Date().toISOString(),
        })
        .eq('id', id)

    if (error) {
        console.error('Update correction status error:', error)
        throw new Error('申請の更新に失敗しました')
    }

    // If approved, we should ideally update the actual data.
    // For MVP, we'll assume the manager manually updates or we can automate it here.
    // Let's automate the appointment update if it's an appointment correction.
    if (status === 'approved') {
        const { data: request } = await supabase
            .from('correction_requests')
            .select('*')
            .eq('id', id)
            .single()

        if (request && request.type === 'appointment') {
            const newCount = parseInt(request.after_value.value)
            await supabase
                .from('daily_appointments')
                .upsert({
                    user_id: request.user_id,
                    date: request.target_date,
                    count: newCount,
                }, { onConflict: 'user_id,date' })
        }
        // Attendance correction is more complex as it involves events. 
        // For MVP, maybe just update the events or keep it as is.
    }

    revalidatePath('/')
}
