'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Role } from '@/types'

const roles: { value: Role; label: string }[] = [
  { value: 'jobseeker', label: '求職者' },
  { value: 'company', label: '企業担当者' },
  { value: 'admin', label: '管理者' },
]

export default function RoleChangeButton({
  userId,
  currentRole,
}: {
  userId: string
  currentRole: Role
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function changeRole(newRole: Role) {
    if (newRole === currentRole) { setOpen(false); return }
    setLoading(true)
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="text-xs text-[--primary] font-medium hover:underline disabled:opacity-50"
      >
        {loading ? '変更中...' : 'ロール変更'}
      </button>
      {open && (
        <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-32 py-1">
          {roles.map(r => (
            <button
              key={r.value}
              onClick={() => changeRole(r.value)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${
                r.value === currentRole ? 'font-bold text-[--primary]' : 'text-gray-700'
              }`}
            >
              {r.value === currentRole ? '✓ ' : ''}{r.label}
            </button>
          ))}
          <button
            onClick={() => setOpen(false)}
            className="w-full text-left px-4 py-2 text-xs text-gray-400 hover:bg-gray-50 border-t border-gray-100 mt-1"
          >
            キャンセル
          </button>
        </div>
      )}
    </div>
  )
}
