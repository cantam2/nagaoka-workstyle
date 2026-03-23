import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendStatusChangedEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { applicationId, status } = await request.json()
    if (!applicationId || !status) {
      return NextResponse.json({ error: 'applicationId and status required' }, { status: 400 })
    }

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

    // 求人またはインターンのタイトルを取得
    let jobTitle = '応募した求人'
    if (app.job_listing_id) {
      const { data: job } = await supabase
        .from('job_listings')
        .select('title')
        .eq('id', app.job_listing_id)
        .single()
      if (job) jobTitle = job.title
    } else if (app.internship_id) {
      const { data: intern } = await supabase
        .from('internship_programs')
        .select('title')
        .eq('id', app.internship_id)
        .single()
      if (intern) jobTitle = intern.title
    }

    // 求職者のメールアドレスを取得
    const { data: { user } } = await admin.auth.admin.getUserById(app.jobseeker_id)
    if (!user?.email) return NextResponse.json({ ok: true })

    await sendStatusChangedEmail({
      to: user.email,
      applicantName: jobseekerProfile?.name ?? '応募者',
      jobTitle,
      status,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('notify/status error:', e)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
