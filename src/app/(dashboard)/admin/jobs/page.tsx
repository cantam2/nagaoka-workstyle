import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile, JobListing, Company } from '@/types'
import JobToggleButton from './JobToggleButton'

interface JobWithCompany extends JobListing {
  companies: Pick<Company, 'name'> | null
}

const employmentLabels: Record<string, string> = {
  fulltime: '正社員',
  parttime: 'パート',
  contract: '契約社員',
  internship: 'インターン',
}

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileData as Pick<Profile, 'role'> | null
  if (profile?.role !== 'admin') redirect('/login')

  let query = supabase
    .from('job_listings')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })

  if (filter === 'published') query = query.eq('is_published', true)
  if (filter === 'draft') query = query.eq('is_published', false)

  const { data } = await query
  const jobs = data as JobWithCompany[] | null

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-[--dark] mb-6">求人管理</h1>

      {/* フィルター */}
      <div className="flex gap-2 mb-6">
        {[
          { label: 'すべて', value: '' },
          { label: '公開中', value: 'published' },
          { label: '下書き', value: 'draft' },
        ].map(f => (
          <a
            key={f.value}
            href={`/admin/jobs?filter=${f.value}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f.value || (!filter && f.value === '')
                ? 'bg-[--primary] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {jobs && jobs.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 text-left">
                <th className="px-6 py-3 font-medium">求人タイトル</th>
                <th className="px-6 py-3 font-medium">企業名</th>
                <th className="px-6 py-3 font-medium">雇用形態</th>
                <th className="px-6 py-3 font-medium">給与</th>
                <th className="px-6 py-3 font-medium">登録日</th>
                <th className="px-6 py-3 font-medium">公開状態</th>
                <th className="px-6 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-sm text-[--dark] max-w-60 truncate">{job.title}</p>
                    {job.catchcopy && (
                      <p className="text-xs text-gray-400 max-w-60 truncate mt-0.5">{job.catchcopy}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{job.companies?.name ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {employmentLabels[job.employment_type] ?? job.employment_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {job.salary_min
                      ? `${(job.salary_min / 10000).toFixed(0)}〜${job.salary_max ? (job.salary_max / 10000).toFixed(0) : '?'}万円`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {new Date(job.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      job.is_published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {job.is_published ? '公開中' : '下書き'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <JobToggleButton jobId={job.id} isPublished={job.is_published} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">求人はまだありません</div>
        )}
      </div>
    </div>
  )
}
