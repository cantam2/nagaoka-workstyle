import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Profile, JobListing, Company } from '@/types'
import ApplyForm from '@/components/jobseeker/ApplyForm'

interface JobWithCompany extends JobListing {
  companies: Company | null
}

export default async function ApplyJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login`)

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileData as Profile | null

  if (profile?.role !== 'jobseeker') redirect('/company')

  const { data: jobData } = await supabase
    .from('job_listings')
    .select('*, companies(*)')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!jobData) notFound()
  const job = jobData as JobWithCompany

  // 既に応募済みか確認
  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('jobseeker_id', user.id)
    .eq('job_listing_id', id)
    .single()

  const employmentLabels: Record<string, string> = {
    fulltime: '正社員', parttime: 'パート・アルバイト',
    contract: '契約社員', internship: 'インターンシップ',
  }

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/jobseeker" className="text-gray-400 hover:text-[--dark]">←</Link>
          <h1 className="font-bold text-[--dark]">応募フォーム</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* 求人概要 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">{job.companies?.name}</p>
          <h2 className="text-lg font-black text-[--dark] mb-2">{job.title}</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs bg-[--primary]/10 text-[--primary] font-bold px-2 py-1 rounded-full">
              {employmentLabels[job.employment_type] ?? job.employment_type}
            </span>
            {job.appeal_tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          {job.salary_min && (
            <p className="text-sm text-gray-600">
              月給 {job.salary_min.toLocaleString()}円{job.salary_max ? `〜${job.salary_max.toLocaleString()}円` : '〜'}
              {job.salary_description && <span className="text-gray-400 ml-1">（{job.salary_description}）</span>}
            </p>
          )}
          {job.location && <p className="text-sm text-gray-500 mt-1">📍 {job.location}</p>}
        </section>

        {/* 応募フォーム or 応募済みメッセージ */}
        {existing ? (
          <section className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <p className="text-lg font-bold text-green-700 mb-2">✅ 応募済みです</p>
            <p className="text-sm text-green-600 mb-4">この求人にはすでに応募しています。</p>
            <Link
              href="/jobseeker/applications"
              className="inline-block px-6 py-2 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 transition"
            >
              応募履歴を確認する
            </Link>
          </section>
        ) : (
          <ApplyForm
            jobseekerId={user.id}
            jobListingId={id}
            jobseekerName={profile?.name}
            jobseekerPhone={profile?.phone}
          />
        )}
      </main>
    </div>
  )
}
