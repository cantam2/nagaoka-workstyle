'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Company } from '@/types'

const industries = [
  '製造業', '食品・飲料', 'IT・情報通信', '建設・土木', '医療・福祉',
  '教育・学習支援', '小売業', '飲食業', '運輸・物流', 'サービス業', 'その他',
]

function toSlug(str: string) {
  return str
    .toLowerCase()
    .replace(/[\s　]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    industry: '',
    description: '',
    location: '',
    employee_count: '',
    founded_year: '',
    website_url: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('profile_id', user.id)
        .single()

      if (data) {
        const c = data as Company
        setCompany(c)
        setSlugTouched(!!c.slug)
        setForm({
          name: c.name,
          slug: c.slug ?? '',
          industry: c.industry ?? '',
          description: c.description ?? '',
          location: c.location ?? '',
          employee_count: c.employee_count ?? '',
          founded_year: c.founded_year?.toString() ?? '',
          website_url: c.website_url ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function handleNameChange(value: string) {
    setForm(prev => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : toSlug(value),
    }))
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true)
    setForm(prev => ({ ...prev, slug: toSlug(value) }))
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      name: form.name,
      slug: form.slug || null,
      industry: form.industry || null,
      description: form.description || null,
      location: form.location || null,
      employee_count: form.employee_count || null,
      founded_year: form.founded_year ? parseInt(form.founded_year) : null,
      website_url: form.website_url || null,
    }

    let error
    if (company) {
      const result = await supabase.from('companies').update(payload).eq('id', company.id)
      error = result.error
    } else {
      const result = await supabase.from('companies').insert({ ...payload, profile_id: user.id })
      error = result.error
    }

    if (error) {
      const msg = error.message.includes('unique')
        ? 'このURLスラッグはすでに使用されています。別の値を入力してください。'
        : '保存に失敗しました: ' + error.message
      setMessage({ type: 'error', text: msg })
    } else {
      setMessage({
        type: 'success',
        text: company ? '企業情報を更新しました' : '企業情報を登録しました。管理者の承認をお待ちください。',
      })
      router.push('/company')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[--background]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-[--dark]">←</button>
          <h1 className="font-bold text-[--dark]">企業情報{company ? 'を編集' : 'を登録'}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {!company && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-700">
            企業情報を登録後、管理者が承認すると求人の掲載が可能になります。
          </div>
        )}

        {message && (
          <div className={`rounded-2xl p-4 mb-6 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-[--dark] mb-2">基本情報</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                企業名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
                placeholder="株式会社長岡製作所"
              />
            </div>

            {/* URLスラッグ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URLスラッグ
                <span className="text-xs text-gray-400 ml-1">（応募ページのURL。英数字とハイフンのみ）</span>
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[--primary] focus-within:ring-2 focus-within:ring-[--primary]/20">
                <span className="px-3 py-3 bg-gray-50 text-xs text-gray-400 border-r border-gray-200 shrink-0">
                  /apply/company/
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  className="flex-1 px-3 py-3 text-sm focus:outline-none bg-white"
                  placeholder="nagaoka-seisakusho"
                />
              </div>
              {form.slug && (
                <p className="text-xs text-gray-400 mt-1">
                  応募ページ: <span className="text-[--primary] font-medium">/apply/company/{form.slug}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">業種</label>
              <select
                value={form.industry}
                onChange={e => setForm({ ...form, industry: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 bg-white"
              >
                <option value="">選択してください</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所在地</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
                placeholder="新潟県長岡市〇〇町1-2-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">従業員数</label>
                <select
                  value={form.employee_count}
                  onChange={e => setForm({ ...form, employee_count: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 bg-white"
                >
                  <option value="">選択</option>
                  <option value="1〜10名">1〜10名</option>
                  <option value="11〜50名">11〜50名</option>
                  <option value="51〜100名">51〜100名</option>
                  <option value="101〜300名">101〜300名</option>
                  <option value="301〜1000名">301〜1000名</option>
                  <option value="1001名以上">1001名以上</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">設立年</label>
                <input
                  type="number"
                  value={form.founded_year}
                  onChange={e => setForm({ ...form, founded_year: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
                  placeholder="1990"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webサイト</label>
              <input
                type="url"
                value={form.website_url}
                onChange={e => setForm({ ...form, website_url: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-[--dark] mb-4">企業紹介</h2>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary] focus:ring-2 focus:ring-[--primary]/20 resize-none"
              placeholder="企業の特徴、強み、文化などを自由に記述してください..."
            />
          </div>

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
              className="flex-1 py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition disabled:opacity-60"
            >
              {saving ? '保存中...' : company ? '更新する' : '登録する'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
