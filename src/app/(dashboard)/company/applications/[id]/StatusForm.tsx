'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { ApplicationStatus } from '@/types'

const statusOptions: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'pending', label: '未確認', color: 'border-blue-300 text-blue-700' },
  { value: 'reviewing', label: '審査中', color: 'border-yellow-300 text-yellow-700' },
  { value: 'accepted', label: '合格', color: 'border-green-400 text-green-700' },
  { value: 'rejected', label: '不合格', color: 'border-gray-300 text-gray-600' },
]

export default function ApplicationStatusForm({
  applicationId,
  currentStatus,
}: {
  applicationId: string
  currentStatus: ApplicationStatus
}) {
  const [status, setStatus] = useState<ApplicationStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)

    // 求職者にメール通知
    fetch('/api/notify/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, status }),
    }).catch(() => {})

    setSaving(false)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition ${
              status === opt.value
                ? `${opt.color} bg-opacity-10`
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || status === currentStatus}
        className="w-full py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition disabled:opacity-50"
      >
        {saving ? '更新中...' : 'ステータスを更新する'}
      </button>
    </div>
  )
}
