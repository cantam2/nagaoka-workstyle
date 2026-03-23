import Link from 'next/link'

export default function PublicHeader() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="font-black text-[--primary]">Nagaoka</span>
            <span className="font-black text-[--dark]">Workstyle</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm font-medium">
            <Link href="/jobs" className="text-gray-600 hover:text-[--primary] transition">求人を探す</Link>
            <Link href="/companies" className="text-gray-600 hover:text-[--primary] transition">企業を見る</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-[--primary] font-medium hover:underline px-3 py-1.5"
          >
            ログイン
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-[--primary] text-white font-bold px-4 py-1.5 rounded-lg hover:bg-[--primary-dark] transition"
          >
            新規登録
          </Link>
        </div>
      </div>
    </header>
  )
}
