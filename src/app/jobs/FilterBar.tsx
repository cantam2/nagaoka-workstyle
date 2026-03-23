'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const employmentTypes = [
  { value: '', label: 'すべて' },
  { value: 'fulltime', label: '正社員' },
  { value: 'parttime', label: 'パート・アルバイト' },
  { value: 'contract', label: '契約社員' },
  { value: 'internship', label: 'インターンシップ' },
]

const industries = [
  '', '製造業', '食品・飲料', 'IT・情報通信', '建設・土木', '医療・福祉',
  '教育・学習支援', '小売業', '飲食業', '運輸・物流', 'サービス業', 'その他',
]

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentType = searchParams.get('type') ?? ''
  const currentIndustry = searchParams.get('industry') ?? ''

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/jobs?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex flex-wrap gap-2">
        {employmentTypes.map(t => (
          <button
            key={t.value}
            onClick={() => update('type', t.value)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${
              currentType === t.value
                ? 'bg-[--primary] text-white border-[--primary]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[--primary] hover:text-[--primary]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <select
        value={currentIndustry}
        onChange={e => update('industry', e.target.value)}
        className="text-xs font-medium px-3 py-1.5 border border-gray-200 rounded-full bg-white text-gray-600 focus:outline-none focus:border-[--primary] ml-auto"
      >
        <option value="">業種を選択</option>
        {industries.slice(1).map(ind => (
          <option key={ind} value={ind}>{ind}</option>
        ))}
      </select>
    </div>
  )
}
