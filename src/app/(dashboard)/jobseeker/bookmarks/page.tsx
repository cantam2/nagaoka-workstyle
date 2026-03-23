import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Bookmark, Company } from '@/types'
import BookmarkRemoveButton from './BookmarkRemoveButton'

interface BookmarkWithCompany extends Bookmark {
  companies: Company | null
}

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileData as Pick<Profile, 'role'> | null
  if (profile?.role !== 'jobseeker') redirect('/login')

  const { data } = await supabase
    .from('bookmarks')
    .select('*, companies(*)')
    .eq('jobseeker_id', user.id)
    .order('created_at', { ascending: false })

  const bookmarks = data as BookmarkWithCompany[] | null

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/jobseeker" className="text-gray-400 hover:text-[--dark]">←</Link>
          <h1 className="font-bold text-[--dark]">お気に入り企業</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {bookmarks && bookmarks.length > 0 ? (
          <div className="space-y-4">
            {bookmarks.map(bm => {
              const company = bm.companies
              return (
                <div key={bm.id} className="bg-white rounded-2xl p-5 shadow-sm flex items-start gap-4">
                  {/* ロゴプレースホルダー */}
                  <div className="w-14 h-14 rounded-xl bg-[--primary]/10 flex items-center justify-center text-[--primary] font-black text-xl shrink-0">
                    {company?.name?.[0] ?? '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[--dark] truncate">{company?.name ?? '-'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[company?.industry, company?.location].filter(Boolean).join(' · ')}
                    </p>
                    {company?.employee_count && (
                      <p className="text-xs text-gray-400 mt-0.5">従業員 {company.employee_count}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-2">
                      追加日：{new Date(bm.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>

                  <BookmarkRemoveButton bookmarkId={bm.id} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-4xl mb-4">🔖</p>
            <p className="font-bold text-[--dark] mb-2">お気に入りはまだありません</p>
            <p className="text-sm text-gray-500 mb-6">気になる企業をお気に入りに追加してみましょう。</p>
            <Link
              href="/jobseeker"
              className="inline-block px-6 py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition text-sm"
            >
              企業を探す
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
