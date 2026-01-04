import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const testUsers = [
    { email: 'owner@test.com', password: 'test1234', full_name: '田中 一郎', role: 'owner' },
    { email: 'manager@test.com', password: 'test1234', full_name: '佐藤 花子', role: 'manager' },
    { email: 'staff@test.com', password: 'test1234', full_name: '山田 太郎', role: 'staff' },
]

export async function POST() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json(
            { error: '環境変数が設定されていません。SUPABASE_SERVICE_ROLE_KEYを確認してください。' },
            { status: 500 }
        )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    const results = []
    const createdUsers: { [key: string]: string } = {}

    for (const user of testUsers) {
        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
            })

            if (authError) {
                if (authError.message.includes('already been registered')) {
                    // User exists, try to get their ID
                    const { data: existingUsers } = await supabase.auth.admin.listUsers()
                    const existingUser = existingUsers?.users?.find(u => u.email === user.email)
                    if (existingUser) {
                        createdUsers[user.role] = existingUser.id
                        results.push({ email: user.email, status: '既に存在', id: existingUser.id })
                    }
                    continue
                }
                results.push({ email: user.email, status: `エラー: ${authError.message}` })
                continue
            }

            if (authData.user) {
                createdUsers[user.role] = authData.user.id

                // Create profile
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: authData.user.id,
                        email: user.email,
                        full_name: user.full_name,
                        role: user.role,
                        hourly_rate: user.role === 'staff' ? 1200 : user.role === 'manager' ? 2000 : 0,
                        appointment_commission: user.role === 'staff' ? 500 : user.role === 'manager' ? 1000 : 0,
                    })

                if (profileError) {
                    results.push({ email: user.email, status: `プロファイル作成エラー: ${profileError.message}`, id: authData.user.id })
                } else {
                    results.push({ email: user.email, status: '作成完了', id: authData.user.id })
                }
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error'
            results.push({ email: user.email, status: `例外: ${errorMessage}` })
        }
    }

    // Update manager_id relationships
    if (createdUsers['manager'] && createdUsers['staff']) {
        await supabase
            .from('profiles')
            .update({ manager_id: createdUsers['manager'] })
            .eq('id', createdUsers['staff'])
    }

    if (createdUsers['owner'] && createdUsers['manager']) {
        await supabase
            .from('profiles')
            .update({ manager_id: createdUsers['owner'] })
            .eq('id', createdUsers['manager'])
    }

    return NextResponse.json({
        success: true,
        results,
        testAccounts: [
            { role: 'オーナー', email: 'owner@test.com', password: 'test1234' },
            { role: 'マネージャー', email: 'manager@test.com', password: 'test1234' },
            { role: 'スタッフ', email: 'staff@test.com', password: 'test1234' },
        ]
    })
}
