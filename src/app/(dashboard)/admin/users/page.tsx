import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'
import RoleChangeButton from './RoleChangeButton'

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: '管理者', color: 'bg-red-100 text-red-700' },
  company: { label: '企業担当者', color: 'bg-blue-100 text-blue-700' },
  jobseeker: { label: '求職者', color: 'bg-green-100 text-green-700' },
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const { role, q } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const myProfile = profileData as Pick<Profile, 'role'> | null
  if (myProfile?.role !== 'admin') redirect('/login')

  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (role) query = query.eq('role', role)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data } = await query
  const users = data as Profile[] | null

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-[--dark] mb-6">ユーザー管理</h1>

      {/* フィルター・検索 */}
      <div className="flex items-center gap-3 mb-6">
        <form className="flex gap-2 flex-1">
          <input
            type="hidden" name="role" value={role ?? ''} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="名前で検索..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[--primary]"
          />
          <button type="submit" className="px-4 py-2 bg-[--primary] text-white text-sm font-medium rounded-xl">
            検索
          </button>
        </form>

        <div className="flex gap-2">
          {[
            { label: 'すべて', value: '' },
            { label: '管理者', value: 'admin' },
            { label: '企業', value: 'company' },
            { label: '求職者', value: 'jobseeker' },
          ].map(f => (
            <a
              key={f.value}
              href={`/admin/users?role=${f.value}${q ? `&q=${q}` : ''}`}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                role === f.value || (!role && f.value === '')
                  ? 'bg-[--primary] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {users && users.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500 text-left">
                <th className="px-6 py-3 font-medium">名前</th>
                <th className="px-6 py-3 font-medium">電話番号</th>
                <th className="px-6 py-3 font-medium">ロール</th>
                <th className="px-6 py-3 font-medium">登録日</th>
                <th className="px-6 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => {
                const rl = roleLabels[u.role]
                const isSelf = u.id === user.id
                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-[--dark]">
                        {u.name ?? '未入力'}
                        {isSelf && <span className="ml-2 text-xs text-gray-400">（自分）</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.phone ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${rl.color}`}>
                        {rl.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4">
                      {!isSelf && (
                        <RoleChangeButton userId={u.id} currentRole={u.role} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-sm text-gray-400">ユーザーはまだいません</div>
        )}
      </div>
    </div>
  )
}
