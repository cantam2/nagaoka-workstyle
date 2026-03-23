import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile, Application } from '@/types'

interface ApplicationWithDetails extends Application {
  profiles: { name: string | null } | null
  job_listings: { title: string; companies: { name: string } | null } | null
  internship_programs: { title: string; companies: { name: string } | null } | null
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '未確認', color: 'bg-blue-100 text-blue-700' },
  reviewing: { label: '審査中', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: '合格', color: 'bg-green-100 text-green-700' },
  rejected: { label: '不合格', color: 'bg-gray-100 text-gray-600' },
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileData as Pick<Profile, 'role'> | null
  if (profile?.role !== 'admin') redirect('/login')

  let query = supabase
    .from('applications')
    .select('*, profiles(name), job_listings(title, companies(name)), internship_programs(title, companies(name))')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data } = await query
  const applications = data as ApplicationWithDetails[] | null

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-[--dark] mb-6">応募管理</h1>

      {/* フィルター */}
      <div className="flex gap-2 mb-6">
        {[
          { label: 'すべて', value: '' },
          { label: '未確認', value: 'pending' },
          { label: '審査中', value: 'reviewing' },
          { label: '合格', value: 'accepted' },
          { label: '不合格', value: 'rejected' },
        ].map(f => (
          <a
            key={f.value}
            href={`/admin/applications?status=${f.value}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              status === f.value || (!status && f.value === '')
                ? 'bg-[--primary] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {applications && applications.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 text-left">
                <th className="px-6 py-3 font-medium">応募者</th>
                <th className="px-6 py-3 font-medium">求人・インターン</th>
                <th className="px-6 py-3 font-medium">企業</th>
                <th className="px-6 py-3 font-medium">応募日</th>
                <th className="px-6 py-3 font-medium">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map(app => {
                const title = app.job_listings?.title ?? app.internship_programs?.title ?? '-'
                const companyName = app.job_listings?.companies?.name
                  ?? app.internship_programs?.companies?.name ?? '-'
                const st = statusLabels[app.status] ?? statusLabels.pending
                return (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-medium text-sm text-[--dark]">
                      {app.profiles?.name ?? '匿名'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-60 truncate">{title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{companyName}</td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(app.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">応募はまだありません</div>
        )}
      </div>
    </div>
  )
}
