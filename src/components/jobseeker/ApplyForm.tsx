'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ApplyFormProps {
  jobseekerId: string
  jobListingId?: string
  internshipId?: string
  jobseekerName?: string | null
  jobseekerPhone?: string | null
}

export default function ApplyForm({
  jobseekerId,
  jobListingId,
  internshipId,
  jobseekerName,
  jobseekerPhone,
}: ApplyFormProps) {
  const [name, setName] = useState(jobseekerName ?? '')
  const [phone, setPhone] = useState(jobseekerPhone ?? '')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // プロフィールの名前・電話番号を更新
    await supabase
      .from('profiles')
      .update({ name: name || null, phone: phone || null })
      .eq('id', jobseekerId)

    // 応募を作成
    const { error: applyError } = await supabase.from('applications').insert({
      jobseeker_id: jobseekerId,
      job_listing_id: jobListingId ?? null,
      internship_id: internshipId ?? null,
      message: message || null,
      status: 'pending',
    })

    if (applyError) {
      setError('応募の送信に失敗しました。もう一度お試しください。')
      setSubmitting(false)
      return
    }

    router.push('/jobseeker/applications?applied=1')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 応募者情報 */}
      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-[--dark]">応募者情報</h3>

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

      {/* 志望動機 */}
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-[--dark] mb-1">志望動機・メッセージ</h3>
        <p className="text-xs text-gray-400 mb-4">
          この企業・求人に応募したい理由や自己PRを自由にご記入ください。（任意）
        </p>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={6}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 resize-none"
          placeholder="例：御社の〇〇に魅力を感じ、ぜひ応募させていただきました。私は..."
        />
        <p className="text-xs text-gray-400 mt-2 text-right">{message.length} 文字</p>
      </section>

      {/* 注意事項 */}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p>・応募後、企業担当者に通知されます。</p>
        <p>・企業からの連絡は、登録メールアドレス宛に届きます。</p>
        <p>・一度送信した応募はキャンセルできません。</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-300 transition"
        >
          戻る
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-2 px-8 py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? '送信中...' : '応募する'}
        </button>
      </div>
    </form>
  )
}
