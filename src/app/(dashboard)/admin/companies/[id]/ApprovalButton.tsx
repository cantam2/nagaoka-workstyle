'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ApprovalButton({
  companyId,
  isApproved,
  fullWidth = false,
}: {
  companyId: string
  isApproved: boolean
  fullWidth?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function toggle() {
    setLoading(true)
    await supabase
      .from('companies')
      .update({ is_approved: !isApproved })
      .eq('id', companyId)
    setLoading(false)
    router.refresh()
  }

  if (isApproved) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={`${fullWidth ? 'w-full' : ''} px-5 py-2.5 border-2 border-red-300 text-red-600 font-bold rounded-xl hover:bg-red-50 transition disabled:opacity-50 text-sm`}
      >
        {loading ? '処理中...' : '承認を取り消す'}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`${fullWidth ? 'w-full' : ''} px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50 text-sm`}
    >
      {loading ? '処理中...' : '✅ 承認する'}
    </button>
  )
}
