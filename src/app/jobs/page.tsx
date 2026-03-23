import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Suspense } from 'react'
import PublicHeader from '@/components/PublicHeader'
import FilterBar from './FilterBar'
import type { JobListing, Company } from '@/types'

interface JobWithCompany extends JobListing {
  companies: Pick<Company, 'name' | 'industry' | 'location' | 'slug'>
}

const employmentLabels: Record<string, string> = {
  fulltime: '正社員',
  parttime: 'パート・アルバイト',
  contract: '契約社員',
  internship: 'インターンシップ',
}

const employmentColors: Record<string, string> = {
  fulltime: 'bg-blue-50 text-blue-700',
  parttime: 'bg-green-50 text-green-700',
  contract: 'bg-purple-50 text-purple-700',
  internship: 'bg-orange-50 text-orange-700',
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; industry?: string }>
}) {
  const { type, industry } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('job_listings')
    .select('*, companies(name, industry, location, slug)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (type) query = query.eq('employment_type', type)
  if (industry) query = query.eq('companies.industry', industry)

  const { data } = await query
  const jobs = (data ?? []) as JobWithCompany[]

  // industryフィルタはクライアント側で補完（Supabaseのリレーション絞り込み制限のため）
  const filtered = industry
    ? jobs.filter(j => j.companies?.industry === industry)
    : jobs

  return (
    <div className="min-h-screen bg-[--background]">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[--dark] mb-1">求人を探す</h1>
          <p className="text-sm text-gray-500">長岡市内の募集中求人 {filtered.length}件</p>
        </div>

        {/* フィルタ */}
        <div className="mb-6">
          <Suspense fallback={null}>
            <FilterBar />
          </Suspense>
        </div>

        {/* 求人リスト */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-400 text-sm">条件に合う求人が見つかりませんでした</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(job => (
              <Link
                key={job.id}
                href={`/apply/job/${job.id}`}
                className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border-2 border-transparent hover:border-[--primary] group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* 企業名 */}
                    <p className="text-xs text-gray-400 mb-1">{job.companies?.name}</p>

                    {/* キャッチコピー */}
                    {job.catchcopy && (
                      <p className="text-xs text-[--primary] font-medium mb-1 line-clamp-1">
                        {job.catchcopy}
                      </p>
                    )}

                    {/* 職種タイトル */}
                    <p className="font-bold text-[--dark] group-hover:text-[--primary] transition truncate text-lg">
                      {job.title}
                    </p>

                    {/* タグ */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${employmentColors[job.employment_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {employmentLabels[job.employment_type] ?? job.employment_type}
                      </span>
                      {job.appeal_tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* 給与・勤務地 */}
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      {job.salary_min && (
                        <span>月給 {job.salary_min.toLocaleString()}円〜{job.salary_max ? `${job.salary_max.toLocaleString()}円` : ''}</span>
                      )}
                      {(job.location ?? job.companies?.location) && (
                        <span>📍 {job.location ?? job.companies?.location}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {job.companies?.industry && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {job.companies.industry}
                      </span>
                    )}
                    <span className="text-[--primary] text-xl group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 企業担当者向けCTA */}
        <div className="mt-12 bg-[--primary]/5 border border-[--primary]/20 rounded-2xl p-6 text-center">
          <p className="font-bold text-[--dark] mb-1">企業担当者の方へ</p>
          <p className="text-sm text-gray-500 mb-4">求人・インターンシップを無料で掲載できます</p>
          <Link
            href="/signup"
            className="inline-block px-6 py-2.5 bg-[--primary] text-white font-bold rounded-xl text-sm hover:bg-[--primary-dark] transition"
          >
            企業アカウントを登録する
          </Link>
        </div>
      </main>
    </div>
  )
}
