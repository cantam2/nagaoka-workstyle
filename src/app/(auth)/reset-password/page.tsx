'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleReset(e: { preventDefault(): void }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError('送信に失敗しました。メールアドレスを確認してください')
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-4">✉️</div>
        <h2 className="text-lg font-bold text-[--dark] mb-2">メールを送信しました</h2>
        <p className="text-sm text-gray-600 mb-6">
          パスワードリセット用のリンクを送信しました。<br />
          メールをご確認ください。
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition"
        >
          ログインページへ戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">パスワードのリセット</p>
        <p className="text-xs text-gray-500">
          登録済みのメールアドレスを入力してください。リセット用リンクをお送りします。
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 transition"
            placeholder="example@email.com"
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
          className="w-full py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition disabled:opacity-60"
        >
          {loading ? '送信中...' : 'リセットメールを送信'}
        </button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-sm text-[--primary] hover:underline">
          ← ログインに戻る
        </Link>
      </div>
    </div>
  )
}
