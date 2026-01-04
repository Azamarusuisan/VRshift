'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { AttendanceType } from '@/types/database'

export async function clockAction(type: AttendanceType) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('認証が必要です')

    const { error } = await supabase
        .from('attendance_events')
        .insert({
            user_id: user.id,
            type: type,
            timestamp: new Date().toISOString(),
        })

    if (error) {
        console.error('Clock action error:', error)
        throw new Error('打刻に失敗しました')
    }

    revalidatePath('/')
}
