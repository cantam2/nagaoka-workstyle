import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Company } from '@/types'

interface CompanyWithProfile extends Company {
  profiles: { name: string | null } | null
}

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>
}) {
  const { filter, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileData as Pick<Profile, 'role'> | null
  if (profile?.role !== 'admin') redirect('/login')

  let query = supabase
    .from('companies')
    .select('*, profiles(name)')
    .order('created_at', { ascending: false })

  if (filter === 'pending') query = query.eq('is_approved', false)
  if (filter === 'approved') query = query.eq('is_approved', true)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data } = await query
  const companies = data as CompanyWithProfile[] | null

  const { count: pendingCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', false)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-[--dark]">企業管理</h1>
        {(pendingCount ?? 0) > 0 && (
          <span className="bg-yellow-100 text-yellow-700 font-bold text-sm px-3 py-1.5 rounded-full">
            {pendingCount}件 承認待ち
          </span>
        )}
      </div>

      {/* フィルター・検索 */}
      <div className="flex items-center gap-3 mb-6">
        <form className="flex gap-2 flex-1">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="企業名で検索..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[--primary] text-white text-sm font-medium rounded-xl"
          >
            検索
          </button>
        </form>

        <div className="flex gap-2">
          {[
            { label: 'すべて', value: '' },
            { label: '未承認', value: 'pending' },
            { label: '承認済', value: 'approved' },
          ].map(f => (
            <Link
              key={f.value}
              href={`/admin/companies?filter=${f.value}`}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                filter === f.value || (!filter && f.value === '')
                  ? 'bg-[--primary] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {companies && companies.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 text-left">
                <th className="px-6 py-3 font-medium">企業名</th>
                <th className="px-6 py-3 font-medium">担当者</th>
                <th className="px-6 py-3 font-medium">業種</th>
                <th className="px-6 py-3 font-medium">所在地</th>
                <th className="px-6 py-3 font-medium">登録日</th>
                <th className="px-6 py-3 font-medium">ステータス</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.map(company => (
                <tr key={company.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm text-[--dark]">{company.name}</div>
                    {company.website_url && (
                      <div className="text-xs text-gray-400 truncate max-w-40">{company.website_url}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {company.profiles?.name ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{company.industry ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{company.location ?? '-'}</td>
                  <td className="px-6 py-4 text-xs text-gray-400">
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
                    <Link
                      href={`/admin/companies/${company.id}`}
                      className="text-xs text-[--primary] font-medium hover:underline"
                    >
                      詳細・管理
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">
            {filter === 'pending' ? '承認待ちの企業はありません' : '企業はまだ登録されていません'}
          </div>
        )}
      </div>
    </div>
  )
}
