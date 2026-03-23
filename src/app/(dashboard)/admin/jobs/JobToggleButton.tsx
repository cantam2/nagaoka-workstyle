'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function JobToggleButton({
  jobId,
  isPublished,
}: {
  jobId: string
  isPublished: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    await supabase.from('job_listings').update({ is_published: !isPublished }).eq('id', jobId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
        isPublished
          ? 'text-red-600 hover:bg-red-50'
          : 'text-green-600 hover:bg-green-50'
      }`}
    >
      {loading ? '...' : isPublished ? '非公開にする' : '公開する'}
    </button>
  )
}
