'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AuthTabs() {
  const pathname = usePathname()
  const isLogin = pathname === '/login' || pathname === '/reset-password'

  return (
    <div className="flex bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <Link
        href="/login"
        className={`flex-1 py-3.5 text-center text-sm font-bold transition ${
          isLogin
            ? 'bg-[--primary] text-white'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        ログイン
      </Link>
      <Link
        href="/signup"
        className={`flex-1 py-3.5 text-center text-sm font-bold transition ${
          !isLogin
            ? 'bg-[--primary] text-white'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        新規登録
      </Link>
    </div>
  )
}
