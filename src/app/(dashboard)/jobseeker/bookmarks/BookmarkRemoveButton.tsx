'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function BookmarkRemoveButton({ bookmarkId }: { bookmarkId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function remove() {
    setLoading(true)
    await supabase.from('bookmarks').delete().eq('id', bookmarkId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-red-500 transition disabled:opacity-50 shrink-0"
      title="お気に入りを解除"
    >
      {loading ? '...' : '🔖 解除'}
    </button>
  )
}
