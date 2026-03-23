import { createClient } from '@supabase/supabase-js'

// サービスロールキーを使用するため、サーバーサイドのみで使用すること
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
