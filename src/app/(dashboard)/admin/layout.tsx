import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/types'

const navItems = [
  { href: '/admin', label: 'ダッシュボード', icon: '📊' },
  { href: '/admin/companies', label: '企業管理', icon: '🏢' },
  { href: '/admin/users', label: 'ユーザー管理', icon: '👥' },
  { href: '/admin/jobs', label: '求人管理', icon: '📋' },
  { href: '/admin/applications', label: '応募管理', icon: '📬' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('role, name').eq('id', user.id).single()
  const profile = profileData as Pick<Profile, 'role' | 'name'> | null
  if (profile?.role !== 'admin') redirect('/login')

  return (
    <div className="min-h-screen bg-[--background] flex">
      {/* サイドバー */}
      <aside className="w-56 bg-[--dark] text-white flex-shrink-0 flex flex-col fixed h-full z-20">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="font-black text-[--primary] text-sm leading-tight">Nagaoka Workstyle</div>
          <div className="text-xs text-white/50 mt-0.5">管理者パネル</div>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-5 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-white/50 mb-3">{profile?.name}</p>
          <form action="/api/auth/signout" method="post">
            <button className="text-xs text-white/50 hover:text-white transition">
              ログアウト →
            </button>
          </form>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}
