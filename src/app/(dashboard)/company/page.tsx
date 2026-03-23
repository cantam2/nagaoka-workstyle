import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Company, JobListing, InternshipProgram, Application } from '@/types'

export default async function CompanyDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null
  if (profile?.role !== 'company') redirect('/login')

  const { data: companyData } = await supabase
    .from('companies')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  const company = companyData as Company | null

  const { data: jobsData } = await supabase
    .from('job_listings')
    .select('*')
    .eq('company_id', company?.id ?? '')
    .order('created_at', { ascending: false })

  const { data: internshipsData } = await supabase
    .from('internship_programs')
    .select('*')
    .eq('company_id', company?.id ?? '')
    .order('created_at', { ascending: false })

  const jobs = jobsData as JobListing[] | null
  const internships = internshipsData as InternshipProgram[] | null

  const { data: applicationsData } = await supabase
    .from('applications')
    .select('*, profiles(name), job_listings(title), internship_programs(title)')
    .in('job_listing_id', jobs?.map(j => j.id) ?? [])
    .order('created_at', { ascending: false })
    .limit(10)

  const applications = applicationsData as (Application & {
    profiles: { name: string } | null
    job_listings: { title: string } | null
    internship_programs: { title: string } | null
  })[] | null

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-[--primary]">Nagaoka</span>
            <span className="font-black text-[--dark]">Workstyle</span>
            <span className="text-xs text-gray-400 ml-2">企業管理</span>
          </div>
          <form action="/api/auth/signout" method="post">
            <button className="text-sm text-gray-500 hover:text-[--dark]">ログアウト</button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 企業名・承認状況 */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-[--dark]">
              {company?.name ?? '企業情報未登録'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{profile?.name} さん</p>
          </div>
          {company && !company.is_approved && (
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full">
              承認待ち
            </span>
          )}
          {company && company.is_approved && (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
              掲載中
            </span>
          )}
        </div>

        {!company && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
            <p className="text-sm font-bold text-yellow-800 mb-2">企業情報が未登録です</p>
            <p className="text-xs text-yellow-700 mb-4">
              求人を掲載するには、まず企業情報を登録して管理者の承認を受けてください。
            </p>
            <Link
              href="/company/profile"
              className="inline-block px-6 py-2 bg-yellow-500 text-white text-sm font-bold rounded-xl hover:bg-yellow-600 transition"
            >
              企業情報を登録する
            </Link>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-4xl font-black text-[--primary]">{jobs?.length ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">求人掲載数</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-4xl font-black text-[--primary]">{internships?.length ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">インターン掲載数</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-4xl font-black text-[--primary]">{applications?.length ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">応募件数（合計）</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 求人管理 */}
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-[--dark] mb-4 flex items-center justify-between">
              求人情報
              <Link href="/company/jobs/new" className="text-xs text-white bg-[--primary] px-3 py-1 rounded-full">
                ＋ 新規追加
              </Link>
            </h2>
            {jobs && jobs.length > 0 ? (
              <ul className="space-y-2">
                {jobs.slice(0, 5).map(job => (
                  <li key={job.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[--dark]">{job.title}</p>
                      <p className="text-xs text-gray-400">
                        {job.is_published ? '✅ 公開中' : '📝 下書き'}
                      </p>
                    </div>
                    <Link
                      href={`/company/jobs/${job.id}/edit`}
                      className="text-xs text-[--primary] hover:underline"
                    >
                      編集
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">求人情報はまだありません</p>
            )}
            <Link href="/company/jobs" className="block mt-4 text-xs text-[--primary] hover:underline">
              すべて見る →
            </Link>
          </section>

          {/* インターン管理 */}
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-[--dark] mb-4 flex items-center justify-between">
              インターンシップ
              <Link href="/company/internships/new" className="text-xs text-white bg-[--primary] px-3 py-1 rounded-full">
                ＋ 新規追加
              </Link>
            </h2>
            {internships && internships.length > 0 ? (
              <ul className="space-y-2">
                {internships.slice(0, 5).map(intern => (
                  <li key={intern.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[--dark]">{intern.title}</p>
                      <p className="text-xs text-gray-400">
                        {intern.is_published ? '✅ 公開中' : '📝 下書き'}
                      </p>
                    </div>
                    <Link
                      href={`/company/internships/${intern.id}/edit`}
                      className="text-xs text-[--primary] hover:underline"
                    >
                      編集
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">インターン情報はまだありません</p>
            )}
          </section>
        </div>

        {/* 応募者一覧（最新） */}
        {applications && applications.length > 0 && (
          <section className="bg-white rounded-2xl p-6 shadow-sm mt-6">
            <h2 className="font-bold text-[--dark] mb-4 flex items-center justify-between">
              最新の応募
              <Link href="/company/applications" className="text-xs text-[--primary]">すべて見る</Link>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2 font-medium">応募者</th>
                    <th className="text-left pb-2 font-medium">求人</th>
                    <th className="text-left pb-2 font-medium">ステータス</th>
                    <th className="text-left pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td className="py-2 font-medium text-[--dark]">
                        {app.profiles?.name ?? '匿名'}
                      </td>
                      <td className="py-2 text-gray-500">
                        {app.job_listings?.title ?? app.internship_programs?.title}
                      </td>
                      <td className="py-2">
                        <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                          {app.status === 'pending' ? '未確認' : app.status}
                        </span>
                      </td>
                      <td className="py-2">
                        <Link
                          href={`/company/applications/${app.id}`}
                          className="text-xs text-[--primary] hover:underline"
                        >
                          詳細
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="mt-6">
          <Link
            href="/company/profile"
            className="inline-block bg-white border border-gray-200 text-[--dark] font-bold rounded-2xl px-6 py-3 hover:border-[--primary] transition text-sm"
          >
            企業情報を編集する →
          </Link>
        </div>
      </main>
    </div>
  )
}
