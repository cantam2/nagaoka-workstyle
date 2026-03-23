'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { JobListing } from '@/types'

interface JobFormProps {
  companyId: string
  existing?: JobListing
}

const APPEAL_TAG_PRESETS = [
  '未経験OK', '経験者優遇', '資格取得支援', '社宅完備', '寮完備',
  '残業代全額支給', '残業少なめ', '土日祝休み', '週休2日', '有給取得率高',
  '育休取得実績', '女性活躍中', '髪型自由', '服装自由', '副業OK',
  '転勤なし', '地元就職', '昇給あり', '賞与年2回', '交通費全額支給',
]

export default function JobForm({ companyId, existing }: JobFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [tagInput, setTagInput] = useState('')

  const [form, setForm] = useState({
    title: existing?.title ?? '',
    catchcopy: existing?.catchcopy ?? '',
    employment_type: existing?.employment_type ?? 'fulltime',
    salary_min: existing?.salary_min?.toString() ?? '',
    salary_max: existing?.salary_max?.toString() ?? '',
    salary_description: existing?.salary_description ?? '',
    location: existing?.location ?? '',
    description: existing?.description ?? '',
    requirements: existing?.requirements ?? '',
    benefits: existing?.benefits ?? '',
    appeal_tags: existing?.appeal_tags ?? [] as string[],
    is_published: existing?.is_published ?? false,
  })

  function toggleTag(tag: string) {
    setForm(prev => ({
      ...prev,
      appeal_tags: prev.appeal_tags.includes(tag)
        ? prev.appeal_tags.filter(t => t !== tag)
        : [...prev.appeal_tags, tag],
    }))
  }

  function addCustomTag() {
    const t = tagInput.trim()
    if (t && !form.appeal_tags.includes(t)) {
      setForm(prev => ({ ...prev, appeal_tags: [...prev.appeal_tags, t] }))
    }
    setTagInput('')
  }

  async function handleSubmit(e: React.FormEvent, publish?: boolean) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const payload = {
      company_id: companyId,
      title: form.title,
      catchcopy: form.catchcopy || null,
      employment_type: form.employment_type as JobListing['employment_type'],
      salary_min: form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      salary_description: form.salary_description || null,
      location: form.location || null,
      description: form.description || null,
      requirements: form.requirements || null,
      benefits: form.benefits || null,
      appeal_tags: form.appeal_tags,
      is_published: publish !== undefined ? publish : form.is_published,
    }

    let error
    if (existing) {
      const result = await supabase.from('job_listings').update(payload).eq('id', existing.id)
      error = result.error
    } else {
      const result = await supabase.from('job_listings').insert(payload)
      error = result.error
    }

    if (error) {
      setMessage({ type: 'error', text: '保存に失敗しました: ' + error.message })
      setSaving(false)
    } else {
      router.push('/company')
    }
  }

  const employmentTypes = [
    { value: 'fulltime', label: '正社員' },
    { value: 'parttime', label: 'パート・アルバイト' },
    { value: 'contract', label: '契約社員' },
    { value: 'internship', label: 'インターンシップ' },
  ]

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

      {/* 基本情報 */}
      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-[--dark]">基本情報</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            キャッチコピー
            <span className="text-xs text-gray-400 ml-1">（求人一覧に表示される一言）</span>
          </label>
          <input
            type="text"
            value={form.catchcopy}
            onChange={e => setForm({ ...form, catchcopy: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
            placeholder={'例：未経験大歓迎！長岡から"ものづくり"のプロへ。'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            求人タイトル <span className="text-red-500">*</span>
            <span className="text-xs text-gray-400 ml-1">（アピールキーワードを含めてください）</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
            placeholder="例：製造スタッフ｜未経験OK・残業代全額支給"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">雇用形態</label>
          <div className="flex flex-wrap gap-2">
            {employmentTypes.map(et => (
              <button
                key={et.value}
                type="button"
                onClick={() => setForm({ ...form, employment_type: et.value as JobListing['employment_type'] })}
                className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${
                  form.employment_type === et.value
                    ? 'border-[--primary] bg-[--primary]/5 text-[--primary]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {et.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">月給（最低）</label>
            <div className="relative">
              <input
                type="number"
                value={form.salary_min}
                onChange={e => setForm({ ...form, salary_min: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
                placeholder="200000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">円</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">月給（最高）</label>
            <div className="relative">
              <input
                type="number"
                value={form.salary_max}
                onChange={e => setForm({ ...form, salary_max: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
                placeholder="350000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">円</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            給与補足説明
            <span className="text-xs text-gray-400 ml-1">（例：各種手当含む / 経験・スキルにより応相談）</span>
          </label>
          <input
            type="text"
            value={form.salary_description}
            onChange={e => setForm({ ...form, salary_description: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">勤務地</label>
          <input
            type="text"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
            placeholder="新潟県長岡市〇〇町"
          />
        </div>
      </section>

      {/* アピールタグ */}
      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-[--dark] mb-4">アピールタグ</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {APPEAL_TAG_PRESETS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                form.appeal_tags.includes(tag)
                  ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {form.appeal_tags.includes(tag) ? '✓ ' : ''}{tag}
            </button>
          ))}
        </div>
        {/* カスタムタグ入力 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary]"
            placeholder="独自タグを追加（Enterで追加）"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
          >
            追加
          </button>
        </div>
        {form.appeal_tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {form.appeal_tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 border border-yellow-400 px-2 py-0.5 rounded-full text-xs font-medium"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="text-yellow-600 hover:text-yellow-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 詳細情報 */}
      <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-[--dark]">詳細情報</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">仕事内容</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 resize-none"
            placeholder="具体的な業務内容を記載してください..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">応募資格・求める人物像</label>
          <textarea
            value={form.requirements}
            onChange={e => setForm({ ...form, requirements: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 resize-none"
            placeholder="必須条件・歓迎条件などを記載してください..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">待遇・福利厚生</label>
          <textarea
            value={form.benefits}
            onChange={e => setForm({ ...form, benefits: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 resize-none"
            placeholder="社会保険・各種手当・休日・有給など..."
          />
        </div>
      </section>

      {/* ボタン */}
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
