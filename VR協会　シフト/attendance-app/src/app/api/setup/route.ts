import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
            { error: '環境変数が設定されていません' },
            { status: 500 }
        )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if tables exist
    const { error } = await supabase.from('profiles').select('id').limit(1)

    if (error && error.code === '42P01') {
        return NextResponse.json({
            ready: false,
            message: 'テーブルが未作成です'
        })
    }

    return NextResponse.json({
        ready: true,
        message: 'データベース接続OK'
    })
}
