import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Company, Application } from '@/types'
import ApplicationStatusForm from './StatusForm'

interface ApplicationWithDetails extends Application {
  profiles: { name: string | null; phone: string | null } | null
  job_listings: { title: string; company_id: string } | null
  internship_programs: { title: string; company_id: string } | null
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileData as Profile | null
  if (profile?.role !== 'company') redirect('/login')

  const { data: companyData } = await supabase.from('companies').select('*').eq('profile_id', user.id).single()
  const company = companyData as Company | null
  if (!company) redirect('/company')

  const { data: appData } = await supabase
    .from('applications')
    .select('*, profiles(name, phone), job_listings(title, company_id), internship_programs(title, company_id)')
    .eq('id', id)
    .single()

  const app = appData as ApplicationWithDetails | null
  if (!app) notFound()

  // 自社への応募かチェック
  const isOwnJob = app.job_listings?.company_id === company.id
  const isOwnIntern = app.internship_programs?.company_id === company.id
  if (!isOwnJob && !isOwnIntern) notFound()

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: '未確認', color: 'bg-blue-100 text-blue-700' },
    reviewing: { label: '審査中', color: 'bg-yellow-100 text-yellow-700' },
    accepted: { label: '合格', color: 'bg-green-100 text-green-700' },
    rejected: { label: '不合格', color: 'bg-gray-100 text-gray-600' },
  }

  const st = statusLabels[app.status]
  const targetTitle = app.job_listings?.title ?? app.internship_programs?.title ?? '-'

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/company" className="text-gray-400 hover:text-[--dark]">←</Link>
          <h1 className="font-bold text-[--dark]">応募詳細</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 応募者情報 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[--dark] mb-4">応募者情報</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex gap-4">
              <dt className="w-24 text-gray-500 shrink-0">氏名</dt>
              <dd className="font-medium text-[--dark]">{app.profiles?.name ?? '未入力'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 text-gray-500 shrink-0">電話番号</dt>
              <dd className="font-medium text-[--dark]">{app.profiles?.phone ?? '未入力'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 text-gray-500 shrink-0">応募先</dt>
              <dd className="font-medium text-[--dark]">{targetTitle}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 text-gray-500 shrink-0">応募日</dt>
              <dd className="text-gray-600">{new Date(app.created_at).toLocaleDateString('ja-JP')}</dd>
            </div>
          </dl>
        </section>

        {/* 志望動機 */}
        {app.message && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-[--dark] mb-3">志望動機・メッセージ</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{app.message}</p>
          </section>
        )}

        {/* ステータス変更 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-[--dark] mb-4">選考ステータス</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${st.color}`}>
              現在: {st.label}
            </span>
          </div>
          <ApplicationStatusForm applicationId={app.id} currentStatus={app.status} />
        </section>
      </main>
    </div>
  )
}
