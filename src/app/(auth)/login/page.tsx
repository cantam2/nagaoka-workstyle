'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    const role = (profile as { role: string } | null)?.role
    if (role === 'admin') router.push('/admin')
    else if (role === 'company') router.push('/company')
    else router.push('/jobseeker')
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          メールアドレス
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 transition"
          placeholder="example@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          パスワード
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 transition"
          placeholder="パスワードを入力"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'ログイン中...' : 'ログイン'}
      </button>

      <div className="text-center pt-1">
        <Link href="/reset-password" className="text-sm text-[--primary] hover:underline">
          パスワードを忘れた方
        </Link>
      </div>
    </form>
  )
}
