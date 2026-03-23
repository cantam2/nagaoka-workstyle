import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Application, Bookmark } from '@/types'

export default async function JobseekerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null
  if (profile?.role !== 'jobseeker') redirect('/login')

  const { data: applicationsData } = await supabase
    .from('applications')
    .select('*, job_listings(title, companies(name)), internship_programs(title, companies(name))')
    .eq('jobseeker_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: bookmarksData } = await supabase
    .from('bookmarks')
    .select('*, companies(name, industry, location)')
    .eq('jobseeker_id', user.id)
    .limit(5)

  const applications = applicationsData as (Application & {
    job_listings: { title: string; companies: { name: string } | null } | null
    internship_programs: { title: string; companies: { name: string } | null } | null
  })[] | null

  const bookmarks = bookmarksData as (Bookmark & {
    companies: { name: string; industry: string | null; location: string | null } | null
  })[] | null

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: '応募済み', color: 'bg-blue-100 text-blue-700' },
    reviewing: { label: '審査中', color: 'bg-yellow-100 text-yellow-700' },
    accepted: { label: '合格', color: 'bg-green-100 text-green-700' },
    rejected: { label: '不合格', color: 'bg-gray-100 text-gray-600' },
  }

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-[--primary]">Nagaoka</span>
            <span className="font-black text-[--dark]">Workstyle</span>
          </div>
          <form action="/api/auth/signout" method="post">
            <button className="text-sm text-gray-500 hover:text-[--dark]">ログアウト</button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-[--dark] mb-1">
          こんにちは、{profile?.name ?? 'さん'} 👋
        </h1>
        <p className="text-sm text-gray-500 mb-8">マイページ</p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 応募履歴 */}
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-[--dark] mb-4 flex items-center justify-between">
              応募履歴
              <Link href="/jobseeker/applications" className="text-xs text-[--primary]">すべて見る</Link>
            </h2>
            {applications && applications.length > 0 ? (
              <ul className="space-y-3">
                {applications.map(app => {
                  const title = app.job_listings?.title ?? app.internship_programs?.title ?? '-'
                  const company = app.job_listings?.companies?.name
                    ?? app.internship_programs?.companies?.name ?? '-'
                  const st = statusLabels[app.status] ?? statusLabels.pending
                  return (
                    <li key={app.id} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[--dark]">{title}</p>
                        <p className="text-xs text-gray-400">{company}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${st.color}`}>
                        {st.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">応募した求人はまだありません</p>
            )}
          </section>

          {/* お気に入り */}
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-[--dark] mb-4 flex items-center justify-between">
              お気に入り企業
              <Link href="/jobseeker/bookmarks" className="text-xs text-[--primary]">すべて見る</Link>
            </h2>
            {bookmarks && bookmarks.length > 0 ? (
              <ul className="space-y-3">
                {bookmarks.map(bm => (
                  <li key={bm.id}>
                    <p className="text-sm font-medium text-[--dark]">{bm.companies?.name}</p>
                    <p className="text-xs text-gray-400">
                      {bm.companies?.industry} · {bm.companies?.location}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">お気に入りに追加した企業はまだありません</p>
            )}
          </section>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link
            href="/"
            className="bg-[--primary] text-white font-bold rounded-2xl p-4 text-center hover:bg-[--primary-dark] transition"
          >
            求人・企業を探す
          </Link>
          <Link
            href="/jobseeker/profile"
            className="bg-white border-2 border-[--primary] text-[--primary] font-bold rounded-2xl p-4 text-center hover:bg-[--primary]/5 transition"
          >
            プロフィール編集
          </Link>
        </div>
      </main>
    </div>
  )
}
