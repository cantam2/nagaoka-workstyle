import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Company, JobListing, InternshipProgram } from '@/types'
import ApprovalButton from './ApprovalButton'

interface CompanyWithProfile extends Company {
  profiles: { name: string | null; id: string } | null
}

export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileData as Pick<Profile, 'role'> | null
  if (profile?.role !== 'admin') redirect('/login')

  const { data: companyData } = await supabase
    .from('companies')
    .select('*, profiles(name, id)')
    .eq('id', id)
    .single()

  if (!companyData) notFound()
  const company = companyData as CompanyWithProfile

  const [{ data: jobsData }, { data: internshipsData }] = await Promise.all([
    supabase.from('job_listings').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('internship_programs').select('*').eq('company_id', id).order('created_at', { ascending: false }),
  ])

  const jobs = jobsData as JobListing[] | null
  const internships = internshipsData as InternshipProgram[] | null

  const infoRows = [
    { label: '企業名', value: company.name },
    { label: '担当者', value: company.profiles?.name },
    { label: '業種', value: company.industry },
    { label: '所在地', value: company.location },
    { label: '従業員数', value: company.employee_count },
    { label: '設立年', value: company.founded_year ? `${company.founded_year}年` : null },
    { label: 'Webサイト', value: company.website_url },
    { label: '登録日', value: new Date(company.created_at).toLocaleDateString('ja-JP') },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/companies" className="text-gray-400 hover:text-[--dark] text-sm">← 企業一覧</Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[--dark]">{company.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{company.industry} · {company.location}</p>
        </div>
        <ApprovalButton companyId={company.id} isApproved={company.is_approved} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* 企業情報 */}
          <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <h2 className="font-bold text-[--dark] px-6 py-4 border-b border-gray-100">企業情報</h2>
            <dl className="divide-y divide-gray-50">
              {infoRows.map(row => row.value && (
                <div key={row.label} className="flex px-6 py-3 text-sm">
                  <dt className="w-28 text-gray-500 shrink-0">{row.label}</dt>
                  <dd className="text-[--dark] font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
            {company.description && (
              <div className="px-6 py-4 border-t border-gray-50">
                <p className="text-xs text-gray-500 mb-2">企業紹介</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{company.description}</p>
              </div>
            )}
          </section>

          {/* 求人一覧 */}
          <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <h2 className="font-bold text-[--dark] px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              求人情報
              <span className="text-xs text-gray-400 font-normal">{jobs?.length ?? 0}件</span>
            </h2>
            {jobs && jobs.length > 0 ? (
              <ul className="divide-y divide-gray-50">
                {jobs.map(job => (
                  <li key={job.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-[--dark]">{job.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {job.employment_type} · {job.is_published ? '公開中' : '下書き'}
                      </p>
                    </div>
                    <Link href={`/admin/jobs`} className="text-xs text-[--primary]">詳細</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-6 text-sm text-gray-400 text-center">求人はまだありません</div>
            )}
          </section>

          {/* インターン一覧 */}
          <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <h2 className="font-bold text-[--dark] px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              インターンシップ
              <span className="text-xs text-gray-400 font-normal">{internships?.length ?? 0}件</span>
            </h2>
            {internships && internships.length > 0 ? (
              <ul className="divide-y divide-gray-50">
                {internships.map(intern => (
                  <li key={intern.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-[--dark]">{intern.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {intern.duration && `${intern.duration} · `}{intern.is_published ? '公開中' : '下書き'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-6 text-sm text-gray-400 text-center">インターンはまだありません</div>
            )}
          </section>
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-[--dark] mb-4">承認ステータス</h2>
            <div className={`rounded-xl p-4 text-center mb-4 ${
              company.is_approved
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <p className={`text-lg font-black ${company.is_approved ? 'text-green-700' : 'text-yellow-700'}`}>
                {company.is_approved ? '✅ 承認済み' : '⏳ 未承認'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {company.is_approved
                  ? '求人の掲載が可能な状態です'
                  : '承認すると求人が掲載できるようになります'}
              </p>
            </div>
            <ApprovalButton companyId={company.id} isApproved={company.is_approved} fullWidth />
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-[--dark] mb-3">統計</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">求人数</span>
                <span className="font-bold text-[--dark]">{jobs?.length ?? 0}件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">インターン数</span>
                <span className="font-bold text-[--dark]">{internships?.length ?? 0}件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">公開求人</span>
                <span className="font-bold text-[--dark]">{jobs?.filter(j => j.is_published).length ?? 0}件</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
