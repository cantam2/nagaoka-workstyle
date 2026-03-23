import AuthTabs from '@/components/auth/AuthTabs'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eaf6fa] to-[#f8fbfd] px-4 py-12">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="text-2xl font-black text-[--primary] tracking-tight">Nagaoka</span>
            <span className="text-2xl font-black text-[--dark]">Workstyle</span>
          </div>
          <p className="text-sm text-gray-500">長岡のはたらくをつなぐポータル</p>
        </div>

        {/* ログイン / 新規登録 タブ */}
        <AuthTabs />

        {/* コンテンツカード */}
        <div className="bg-white rounded-b-2xl shadow-xl border border-t-0 border-gray-100 px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  )
}
