'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function incrementAppointment() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('認証が必要です')

    const today = new Date().toISOString().split('T')[0]

    // Upsert daily appointment count
    const { data, error: fetchError } = await supabase
        .from('daily_appointments')
        .select('count')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error('データの取得に失敗しました')
    }

    const newCount = (data?.count || 0) + 1

    const { error } = await supabase
        .from('daily_appointments')
        .upsert({
            user_id: user.id,
            date: today,
            count: newCount,
        }, { onConflict: 'user_id,date' })

    if (error) {
        console.error('Appointment increment error:', error)
        throw new Error('アポ数の更新に失敗しました')
    }

    revalidatePath('/')
}
