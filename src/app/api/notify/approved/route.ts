import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendApprovedEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await request.json()
    if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

    const supabase = await createClient()
    const admin = createAdminClient()

    // 企業情報を取得
    const { data: company } = await supabase
      .from('companies')
      .select('name, profile_id')
      .eq('id', companyId)
      .single()
    if (!company) return NextResponse.json({ error: 'not found' }, { status: 404 })

    // 企業担当者のメールアドレスを取得
    const { data: { user } } = await admin.auth.admin.getUserById(company.profile_id)
    if (!user?.email) return NextResponse.json({ ok: true })

    await sendApprovedEmail({
      to: user.email,
      companyName: company.name,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('notify/approved error:', e)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
