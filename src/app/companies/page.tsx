import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'
import type { Company } from '@/types'

const industries = [
  '製造業', '食品・飲料', 'IT・情報通信', '建設・土木', '医療・福祉',
  '教育・学習支援', '小売業', '飲食業', '運輸・物流', 'サービス業', 'その他',
]

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string }>
}) {
  const { industry } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('companies')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  if (industry) query = query.eq('industry', industry)

  const { data } = await query
  const companies = (data ?? []) as Company[]

  return (
    <div className="min-h-screen bg-[--background]">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[--dark] mb-1">企業を見る</h1>
          <p className="text-sm text-gray-500">長岡市内の掲載企業 {companies.length}社</p>
        </div>

        {/* 業種フィルタ */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/companies"
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
              !industry
                ? 'bg-[--primary] text-white border-[--primary]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[--primary] hover:text-[--primary]'
            }`}
          >
            すべて
          </Link>
          {industries.map(ind => (
            <Link
              key={ind}
              href={`/companies?industry=${encodeURIComponent(ind)}`}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
                industry === ind
                  ? 'bg-[--primary] text-white border-[--primary]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[--primary] hover:text-[--primary]'
              }`}
            >
              {ind}
            </Link>
          ))}
        </div>

        {/* 企業リスト */}
        {companies.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-400 text-sm">条件に合う企業が見つかりませんでした</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {companies.map(company => (
              <Link
                key={company.id}
                href={company.slug ? `/apply/company/${company.slug}` : '#'}
                className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border-2 border-transparent hover:border-[--primary] group"
              >
                <div className="flex items-center gap-4 mb-3">
                  {/* ロゴ（頭文字） */}
                  <div className="w-12 h-12 rounded-xl bg-[--primary]/10 flex items-center justify-center text-[--primary] font-black text-xl shrink-0">
                    {company.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[--dark] group-hover:text-[--primary] transition truncate">
                      {company.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[company.industry, company.location].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>

                {company.description && (
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {company.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {company.employee_count && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      👥 {company.employee_count}
                    </span>
                  )}
                  {company.founded_year && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      🏢 {company.founded_year}年設立
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 企業担当者向けCTA */}
        <div className="mt-12 bg-[--primary]/5 border border-[--primary]/20 rounded-2xl p-6 text-center">
          <p className="font-bold text-[--dark] mb-1">掲載企業を募集中</p>
          <p className="text-sm text-gray-500 mb-4">長岡市内の企業であれば無料で掲載できます</p>
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
