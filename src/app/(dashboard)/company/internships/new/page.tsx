import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import InternshipForm from '@/components/company/InternshipForm'
import type { Profile, Company } from '@/types'

export default async function NewInternshipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const profile = profileData as Profile | null
  if (profile?.role !== 'company') redirect('/login')

  const { data: companyData } = await supabase.from('companies').select('*').eq('profile_id', user.id).single()
  const company = companyData as Company | null
  if (!company) redirect('/company/profile')
  if (!company.is_approved) redirect('/company')

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/company" className="text-gray-400 hover:text-[--dark]">←</Link>
          <h1 className="font-bold text-[--dark]">インターンシップを追加</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <InternshipForm companyId={company.id} />
      </main>
    </div>
  )
}
