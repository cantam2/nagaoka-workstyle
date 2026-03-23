'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { InternshipProgram } from '@/types'

interface InternshipFormProps {
  companyId: string
  existing?: InternshipProgram
}

export default function InternshipForm({ companyId, existing }: InternshipFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    title: existing?.title ?? '',
    duration: existing?.duration ?? '',
    description: existing?.description ?? '',
    requirements: existing?.requirements ?? '',
    capacity: existing?.capacity?.toString() ?? '',
    is_published: existing?.is_published ?? false,
  })

  async function handleSubmit(e: React.FormEvent, publish?: boolean) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const payload = {
      company_id: companyId,
      title: form.title,
      duration: form.duration || null,
      description: form.description || null,
      requirements: form.requirements || null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      is_published: publish !== undefined ? publish : form.is_published,
    }

    let error
    if (existing) {
      const result = await supabase.from('internship_programs').update(payload).eq('id', existing.id)
      error = result.error
    } else {
      const result = await supabase.from('internship_programs').insert(payload)
      error = result.error
    }

    if (error) {
      setMessage({ type: 'error', text: '保存に失敗しました: ' + error.message })
      setSaving(false)
    } else {
      router.push('/company')
    }
  }

  return (
    <form onSubmit={e => handleSubmit(e)} className="space-y-6">
      {message && (
        <div className={`rounded-2xl p-4 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-[--dark]">基本情報</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            インターンシップ名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
            placeholder="例：1day仕事体験・短期インターン（2週間）"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">期間</label>
            <input
              type="text"
              value={form.duration}
              onChange={e => setForm({ ...form, duration: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
              placeholder="例：1日 / 2週間 / 1〜3ヶ月"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">募集人数</label>
            <div className="relative">
              <input
                type="number"
                value={form.capacity}
                onChange={e => setForm({ ...form, capacity: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
                placeholder="5"
                min="1"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">名</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-[--dark]">詳細情報</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">プログラム内容</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 resize-none"
            placeholder="インターンシップで体験できる内容、スケジュールなどを記載してください..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">応募条件</label>
          <textarea
            value={form.requirements}
            onChange={e => setForm({ ...form, requirements: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 resize-none"
            placeholder="大学生・大学院生・高校生など、応募対象を記載してください..."
          />
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-300 transition"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving}
          onClick={e => handleSubmit(e, false)}
          className="flex-1 py-3 border-2 border-[--primary] text-[--primary] font-bold rounded-xl hover:bg-[--primary]/5 transition disabled:opacity-60"
        >
          下書き保存
        </button>
        <button
          type="submit"
          disabled={saving}
          onClick={e => handleSubmit(e, true)}
          className="flex-1 py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition disabled:opacity-60"
        >
          {saving ? '保存中...' : '公開する'}
        </button>
      </div>
    </form>
  )
}
