'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Role = 'jobseeker' | 'company'

const roleLabels: Record<Role, { label: string; desc: string; icon: string }> = {
  jobseeker: {
    label: '求職者・学生',
    desc: '就職・転職・インターンを探している方',
    icon: '🎓',
  },
  company: {
    label: '企業担当者',
    desc: '求人・インターン情報を掲載したい企業の方',
    icon: '🏢',
  },
}

export default function SignupPage() {
  const [role, setRole] = useState<Role>('jobseeker')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  async function handleSignup(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'このメールアドレスはすでに登録されています'
        : '登録に失敗しました。しばらくしてから再度お試しください'
      )
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-4">✉️</div>
        <h2 className="text-lg font-bold text-[--dark] mb-2">確認メールを送信しました</h2>
        <p className="text-sm text-gray-600 mb-6">
          <strong>{email}</strong> に確認メールを送りました。<br />
          メール内のリンクをクリックして登録を完了してください。
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition"
        >
          ログインページへ
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 登録種別 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">登録種別</p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(roleLabels) as Role[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`p-3 rounded-xl border-2 text-left transition ${
                role === r
                  ? 'border-[--primary] bg-[--primary]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{roleLabels[r].icon}</div>
              <div className="text-sm font-bold text-[--dark]">{roleLabels[r].label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{roleLabels[r].desc}</div>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {role === 'company' ? '担当者名' : 'お名前'}
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 transition"
            placeholder="長岡 太郎"
          />
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            パスワード <span className="text-xs text-gray-400">（8文字以上）</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 transition"
            placeholder="パスワードを入力"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">パスワード（確認）</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 transition"
            placeholder="パスワードを再入力"
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
          {loading ? '登録中...' : '登録する'}
        </button>
      </form>
    </div>
  )
}
