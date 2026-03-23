import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Company } from '@/types'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileData as Profile | null
  if (profile?.role !== 'admin') redirect('/login')

  const [
    { count: totalUsers },
    { count: totalCompanies },
    { count: pendingCompanies },
    { count: totalJobs },
    { count: totalApplications },
    { data: recentCompaniesData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    supabase.from('job_listings').select('*', { count: 'exact', head: true }),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const recentCompanies = recentCompaniesData as Company[] | null

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-[--dark] mb-8">ダッシュボード</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: '登録ユーザー', value: totalUsers ?? 0, href: '/admin/users' },
          { label: '登録企業', value: totalCompanies ?? 0, href: '/admin/companies' },
          { label: '承認待ち企業', value: pendingCompanies ?? 0, href: '/admin/companies?filter=pending', highlight: (pendingCompanies ?? 0) > 0 },
          { label: '求人掲載数', value: totalJobs ?? 0, href: '/admin/jobs' },
          { label: '応募件数', value: totalApplications ?? 0, href: '/admin/applications' },
        ].map(stat => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`bg-white rounded-2xl p-5 shadow-sm text-center hover:shadow-md transition ${stat.highlight ? 'ring-2 ring-yellow-400' : ''}`}
          >
            <p className={`text-3xl font-black ${stat.highlight ? 'text-yellow-600' : 'text-[--primary]'}`}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* 最近の企業登録 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[--dark]">最近の企業登録</h2>
          <Link href="/admin/companies" className="text-xs text-[--primary] hover:underline">
            すべて見る →
          </Link>
        </div>
        {recentCompanies && recentCompanies.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 text-left">
                <th className="px-6 py-3 font-medium">企業名</th>
                <th className="px-6 py-3 font-medium">業種</th>
                <th className="px-6 py-3 font-medium">所在地</th>
                <th className="px-6 py-3 font-medium">登録日</th>
                <th className="px-6 py-3 font-medium">ステータス</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentCompanies.map(company => (
                <tr key={company.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-medium text-sm text-[--dark]">{company.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{company.industry ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{company.location ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(company.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4">
                    {company.is_approved ? (
                      <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full">承認済</span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded-full">未承認</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/companies/${company.id}`} className="text-xs text-[--primary] hover:underline">
                      管理
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-gray-400">登録企業はまだありません</div>
        )}
      </div>
    </div>
  )
}
