import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'

export default async function Home() {
  const supabase = await createClient()

  const [jobsRes, companiesRes] = await Promise.all([
    supabase.from('job_listings').select('id', { count: 'exact' }).eq('is_published', true),
    supabase.from('companies').select('id', { count: 'exact' }).eq('is_approved', true),
  ])

  const jobCount = jobsRes.count ?? 0
  const companyCount = companiesRes.count ?? 0

  return (
    <div className="min-h-screen bg-[--background]">
      <PublicHeader />

      {/* ヒーローセクション */}
      <section className="bg-gradient-to-br from-[--primary]/10 to-[--background] py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-[--dark] mb-4 leading-tight">
            長岡で、はたらく。<br />
            <span className="text-[--primary]">あなたに合う仕事</span>が見つかる。
          </h1>
          <p className="text-gray-500 mb-8 text-sm sm:text-base">
            長岡市内の求人・インターンシップ情報を一覧で確認。<br />
            登録無料で応募まで完結できます。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/jobs"
              className="px-8 py-3.5 bg-[--primary] text-white font-black rounded-xl hover:bg-[--primary-dark] transition text-base shadow-md shadow-[--primary]/20"
            >
              求人を探す →
            </Link>
            <Link
              href="/companies"
              className="px-8 py-3.5 border-2 border-[--primary] text-[--primary] font-black rounded-xl hover:bg-[--primary]/5 transition text-base"
            >
              企業を見る
            </Link>
          </div>

          {/* 統計 */}
          <div className="flex justify-center gap-8 mt-10">
            <div className="text-center">
              <p className="text-3xl font-black text-[--primary]">{jobCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">募集中の求人</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-3xl font-black text-[--primary]">{companyCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">掲載企業</p>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-xl font-black text-[--dark] text-center mb-8">
          長岡ワークスタイルの特徴
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: '📍',
              title: '長岡に特化',
              desc: '長岡市内の企業だけを掲載。地元で働きたい方にぴったりの求人が見つかります。',
            },
            {
              icon: '⚡',
              title: 'サイト内で完結',
              desc: '登録から応募まですべてオンラインで完結。紙の履歴書は不要です。',
            },
            {
              icon: '🎓',
              title: 'インターンも探せる',
              desc: '就職活動中の学生向けのインターンシップ情報も掲載しています。',
            },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-[--dark] mb-2">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 企業向けCTA */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-[--dark] rounded-2xl p-8 text-center">
          <p className="text-white font-black text-lg mb-2">採用担当者の方へ</p>
          <p className="text-gray-400 text-sm mb-6">
            求人・インターンシップを無料で掲載できます。<br />
            応募管理もダッシュボードで一括管理。
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/signup"
              className="px-6 py-2.5 bg-[--primary] text-white font-bold rounded-xl text-sm hover:bg-[--primary-dark] transition"
            >
              企業登録（無料）
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 border border-gray-600 text-gray-300 font-bold rounded-xl text-sm hover:border-gray-400 transition"
            >
              ログイン
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
