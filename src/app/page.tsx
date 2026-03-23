import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#eaf6fa] to-[#f8fbfd]">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-4xl font-black text-[--primary] tracking-tight">Nagaoka</span>
          <span className="text-4xl font-black text-[--dark]">Workstyle</span>
        </div>
        <p className="text-gray-500 mb-8">長岡のはたらくをつなぐポータル</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-[--primary] text-white font-bold rounded-xl hover:bg-[--primary-dark] transition"
          >
            ログイン
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 border-2 border-[--primary] text-[--primary] font-bold rounded-xl hover:bg-[--primary]/5 transition"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  )
}
