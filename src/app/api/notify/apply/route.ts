import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNewApplicationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { applicationId } = await request.json()
    if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 })

    const supabase = await createClient()
    const admin = createAdminClient()

    // 応募情報を取得
    const { data: app } = await supabase
      .from('applications')
      .select('jobseeker_id, job_listing_id, internship_id')
      .eq('id', applicationId)
      .single()
    if (!app) return NextResponse.json({ error: 'not found' }, { status: 404 })

    // 求職者名を取得
    const { data: jobseekerProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', app.jobseeker_id)
      .single()

    // 求人またはインターン情報 + 企業情報を取得
    let jobTitle = '求人'
    let companyProfileId: string | null = null
    let companyName = '企業'
    let applicationUrl = 'https://nagaoka-workstyle.vercel.app/company/applications'

    if (app.job_listing_id) {
      const { data: job } = await supabase
        .from('job_listings')
        .select('title, company_id')
        .eq('id', app.job_listing_id)
        .single()
      if (job) {
        jobTitle = job.title
        const { data: company } = await supabase
          .from('companies')
          .select('name, profile_id')
          .eq('id', job.company_id)
          .single()
        companyProfileId = company?.profile_id ?? null
        companyName = company?.name ?? companyName
      }
    } else if (app.internship_id) {
      const { data: intern } = await supabase
        .from('internship_programs')
        .select('title, company_id')
        .eq('id', app.internship_id)
        .single()
      if (intern) {
        jobTitle = intern.title
        const { data: company } = await supabase
          .from('companies')
          .select('name, profile_id')
          .eq('id', intern.company_id)
          .single()
        companyProfileId = company?.profile_id ?? null
        companyName = company?.name ?? companyName
      }
    }

    if (!companyProfileId) return NextResponse.json({ ok: true })

    // 企業担当者のメールアドレスを取得（管理者クライアント経由）
    const { data: { user } } = await admin.auth.admin.getUserById(companyProfileId)
    if (!user?.email) return NextResponse.json({ ok: true })

    await sendNewApplicationEmail({
      to: user.email,
      companyName,
      jobTitle,
      applicantName: jobseekerProfile?.name ?? '応募者',
      dashboardUrl: `${applicationUrl}/${applicationId}`,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('notify/apply error:', e)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
