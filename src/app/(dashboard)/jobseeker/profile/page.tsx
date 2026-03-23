'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/types'

export default function JobseekerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        const p = data as Profile
        setProfile(p)
        setName(p.name ?? '')
        setPhone(p.phone ?? '')
      }
    }
    load()
  }, [])

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ name: name || null, phone: phone || null })
      .eq('id', profile!.id)

    if (error) {
      setMessage({ type: 'error', text: '保存に失敗しました' })
    } else {
      setMessage({ type: 'success', text: 'プロフィールを更新しました' })
    }
    setSaving(false)
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/jobseeker" className="text-gray-400 hover:text-[--dark]">←</Link>
          <h1 className="font-bold text-[--dark]">プロフィール編集</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {message && (
          <div className={`rounded-2xl p-4 mb-6 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-[--dark]">基本情報</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
                placeholder="長岡 太郎"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                電話番号
                <span className="text-xs text-gray-400 ml-1">（企業からの連絡先）</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
                placeholder="090-1234-5678"
              />
            </div>
          </section>

          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
            <p>・メールアドレスはログイン設定から変更できます。</p>
            <p>・登録した電話番号は応募時に企業に伝わります。</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition disabled:opacity-60"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </form>
      </main>
    </div>
  )
}
