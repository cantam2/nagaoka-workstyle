'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BookmarkButton({ companyId }: { companyId: string }) {
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkId, setBookmarkId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('jobseeker_id', user.id)
        .eq('company_id', companyId)
        .single()

      if (data) {
        setBookmarked(true)
        setBookmarkId(data.id)
      }
      setLoading(false)
    }
    init()
  }, [companyId])

  async function toggle() {
    if (!userId) return
    setLoading(true)

    if (bookmarked && bookmarkId) {
      await supabase.from('bookmarks').delete().eq('id', bookmarkId)
      setBookmarked(false)
      setBookmarkId(null)
    } else {
      const { data } = await supabase
        .from('bookmarks')
        .insert({ jobseeker_id: userId, company_id: companyId })
        .select('id')
        .single()
      if (data) {
        setBookmarked(true)
        setBookmarkId(data.id)
      }
    }
    setLoading(false)
  }

  if (!userId) return null

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition disabled:opacity-50 ${
        bookmarked
          ? 'bg-[--primary] border-[--primary] text-white'
          : 'bg-white border-gray-200 text-gray-600 hover:border-[--primary] hover:text-[--primary]'
      }`}
    >
      <span>{bookmarked ? '🔖' : '📌'}</span>
      {bookmarked ? 'お気に入り済み' : 'お気に入りに追加'}
    </button>
  )
}
