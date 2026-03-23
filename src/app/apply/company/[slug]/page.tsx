import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Company, JobListing, InternshipProgram } from '@/types'

interface CompanyWithJobs extends Company {
  job_listings: JobListing[]
  internship_programs: InternshipProgram[]
}

const employmentLabels: Record<string, string> = {
  fulltime: '正社員', parttime: 'パート・アルバイト',
  contract: '契約社員', internship: 'インターンシップ',
}

export default async function CompanyApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const { slug } = await params
  const { type } = await searchParams
  const supabase = await createClient()

  const { data } = await supabase
    .from('companies')
    .select('*, job_listings(*), internship_programs(*)')
    .eq('slug', slug)
    .eq('is_approved', true)
    .single()

  if (!data) notFound()
  const company = data as CompanyWithJobs

  const jobs = company.job_listings.filter(j => j.is_published)
  const internships = company.internship_programs.filter(i => i.is_published)

  const showJobs = !type || type === 'job'
  const showInternships = !type || type === 'intern'

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-[--primary]">Nagaoka</span>
            <span className="font-black text-[--dark]">Workstyle</span>
          </div>
          <Link href="/login" className="text-xs text-[--primary] font-medium hover:underline">
            ログイン / 新規登録
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 企業ヘッダー */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-[--primary]/10 flex items-center justify-center text-[--primary] font-black text-2xl">
              {company.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-black text-[--dark]">{company.name}</h1>
              <p className="text-sm text-gray-500">
                {[company.industry, company.location].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          {company.description && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{company.description}</p>
          )}
        </section>

        {/* 応募先を選択 */}
        <div>
          <h2 className="text-lg font-black text-[--dark] mb-4">応募する求人を選んでください</h2>

          {/* 求人 */}
          {showJobs && jobs.length > 0 && (
            <div className="space-y-3 mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">募集中の求人</p>
              {jobs.map(job => (
                <Link
                  key={job.id}
                  href={`/apply/job/${job.id}`}
                  className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition group border-2 border-transparent hover:border-[--primary]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {job.catchcopy && (
                        <p className="text-xs text-[--primary] font-medium mb-1 line-clamp-1">{job.catchcopy}</p>
                      )}
                      <p className="font-bold text-[--dark] group-hover:text-[--primary] transition truncate">
                        {job.title}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-xs bg-[--primary]/10 text-[--primary] font-bold px-2 py-0.5 rounded-full">
                          {employmentLabels[job.employment_type] ?? job.employment_type}
                        </span>
                        {job.appeal_tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {job.salary_min && (
                        <p className="text-sm text-gray-600 mt-2">
                          月給 {job.salary_min.toLocaleString()}円〜
                        </p>
                      )}
                    </div>
                    <span className="text-[--primary] text-xl mt-1 shrink-0 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* インターン */}
          {showInternships && internships.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">インターンシップ</p>
              {internships.map(intern => (
                <Link
                  key={intern.id}
                  href={`/apply/internship/${intern.id}`}
                  className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition group border-2 border-transparent hover:border-[--primary]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[--dark] group-hover:text-[--primary] transition truncate">
                        {intern.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {intern.duration && `📅 ${intern.duration}`}
                        {intern.capacity && ` · 定員${intern.capacity}名`}
                      </p>
                    </div>
                    <span className="text-[--primary] text-xl mt-1 shrink-0 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* 求人なし */}
          {jobs.length === 0 && internships.length === 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <p className="text-gray-400 text-sm mb-4">現在募集中の求人はありません</p>
              <Link
                href="/signup"
                className="inline-block px-6 py-3 bg-[--primary] text-white font-bold rounded-xl text-sm hover:bg-[--primary-dark] transition"
              >
                会員登録して通知を受け取る
              </Link>
            </div>
          )}
        </div>

        {/* ログイン誘導 */}
        <div className="bg-[--primary]/5 border border-[--primary]/20 rounded-2xl p-5 text-center">
          <p className="text-sm font-bold text-[--dark] mb-1">応募にはアカウントが必要です</p>
          <p className="text-xs text-gray-500 mb-4">無料で登録できます。30秒で完了します。</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-[--primary] text-white font-bold rounded-xl text-sm hover:bg-[--primary-dark] transition"
            >
              新規登録
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 border-2 border-[--primary] text-[--primary] font-bold rounded-xl text-sm hover:bg-[--primary]/5 transition"
            >
              ログイン
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
