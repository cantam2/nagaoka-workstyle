import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Profile, InternshipProgram, Company } from '@/types'
import ApplyForm from '@/components/jobseeker/ApplyForm'

interface InternshipWithCompany extends InternshipProgram {
  companies: Company | null
}

export default async function ApplyInternshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileData as Profile | null
  if (profile?.role !== 'jobseeker') redirect('/company')

  const { data: internData } = await supabase
    .from('internship_programs')
    .select('*, companies(*)')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!internData) notFound()
  const internship = internData as InternshipWithCompany

  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('jobseeker_id', user.id)
    .eq('internship_id', id)
    .single()

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/jobseeker" className="text-gray-400 hover:text-[--dark]">←</Link>
          <h1 className="font-bold text-[--dark]">インターンシップ応募フォーム</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* インターン概要 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">{internship.companies?.name}</p>
          <h2 className="text-lg font-black text-[--dark] mb-2">{internship.title}</h2>
          {internship.duration && (
            <p className="text-sm text-gray-600">📅 期間：{internship.duration}</p>
          )}
          {internship.capacity && (
            <p className="text-sm text-gray-500 mt-1">👥 募集人数：{internship.capacity}名</p>
          )}
        </section>

        {existing ? (
          <section className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <p className="text-lg font-bold text-green-700 mb-2">✅ 応募済みです</p>
            <p className="text-sm text-green-600 mb-4">このインターンシップにはすでに応募しています。</p>
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
            internshipId={id}
            jobseekerName={profile?.name}
            jobseekerPhone={profile?.phone}
          />
        )}
      </main>
    </div>
  )
}
