import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import JobForm from '@/components/company/JobForm'
import type { Profile, Company, JobListing } from '@/types'

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileData as Profile | null
  if (profile?.role !== 'company') redirect('/login')

  const { data: companyData } = await supabase.from('companies').select('*').eq('profile_id', user.id).single()
  const company = companyData as Company | null
  if (!company) redirect('/company/profile')

  const { data: jobData } = await supabase.from('job_listings').select('*').eq('id', id).single()
  const job = jobData as JobListing | null
  if (!job || job.company_id !== company.id) notFound()

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/company" className="text-gray-400 hover:text-[--dark]">←</Link>
          <h1 className="font-bold text-[--dark]">求人を編集</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <JobForm companyId={company.id} existing={job} />
      </main>
    </div>
  )
}
