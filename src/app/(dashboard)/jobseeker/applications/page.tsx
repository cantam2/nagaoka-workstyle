import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Application } from '@/types'

interface ApplicationWithDetails extends Application {
  job_listings: {
    title: string
    employment_type: string
    companies: { name: string } | null
  } | null
  internship_programs: {
    title: string
    duration: string | null
    companies: { name: string } | null
  } | null
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: '応募済み', color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200' },
  reviewing: { label: '審査中',   color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  accepted:  { label: '合格',     color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  rejected:  { label: '不合格',   color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
}

const employmentLabels: Record<string, string> = {
  fulltime: '正社員', parttime: 'パート', contract: '契約社員', internship: 'インターン',
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ applied?: string }>
}) {
  const { applied } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileData as Pick<Profile, 'role'> | null
  if (profile?.role !== 'jobseeker') redirect('/login')

  const { data } = await supabase
    .from('applications')
    .select(`
      *,
      job_listings(title, employment_type, companies(name)),
      internship_programs(title, duration, companies(name))
    `)
    .eq('jobseeker_id', user.id)
    .order('created_at', { ascending: false })

  const applications = data as ApplicationWithDetails[] | null

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/jobseeker" className="text-gray-400 hover:text-[--dark]">←</Link>
          <h1 className="font-bold text-[--dark]">応募履歴</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {applied === '1' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold text-green-700 text-sm">応募を受け付けました</p>
              <p className="text-xs text-green-600">企業からの連絡をお待ちください。</p>
            </div>
          </div>
        )}

        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map(app => {
              const isJob = !!app.job_listing_id
              const title = app.job_listings?.title ?? app.internship_programs?.title ?? '-'
              const company = app.job_listings?.companies?.name ?? app.internship_programs?.companies?.name ?? '-'
              const sub = isJob
                ? (employmentLabels[app.job_listings?.employment_type ?? ''] ?? '')
                : (app.internship_programs?.duration ?? 'インターン')
              const st = statusConfig[app.status] ?? statusConfig.pending

              return (
                <div key={app.id} className={`bg-white rounded-2xl p-5 shadow-sm border ${
                  app.status === 'accepted' ? 'border-green-200' : 'border-transparent'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 mb-0.5">{company}</p>
                      <p className="font-bold text-[--dark] truncate">{title}</p>
                      <p className="text-xs text-gray-500 mt-1">{sub}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ${st.bg} ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span>応募日：{new Date(app.created_at).toLocaleDateString('ja-JP')}</span>
                    {app.status === 'accepted' && (
                      <span className="text-green-600 font-bold">企業からの連絡をご確認ください</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-bold text-[--dark] mb-2">応募した求人はまだありません</p>
            <p className="text-sm text-gray-500 mb-6">気になる企業・求人に応募してみましょう。</p>
            <Link
              href="/jobseeker"
              className="inline-block px-6 py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition text-sm"
            >
              求人を探す
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
