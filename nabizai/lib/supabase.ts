import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Cookie-based browser client — nabizai şeması
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'nabizai' },
})
