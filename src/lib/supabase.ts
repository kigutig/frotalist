import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://kepkxjvrsegoedshjatv.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGt4anZyc2Vnb2Vkc2hqYXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDkyOTksImV4cCI6MjEwMzkyNTI5OX0.YLIz3DNo7TtdIdzm89KiCGcTg4LvIDk03Uao2NchEWw'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

export type { SupabaseClient } from '@supabase/supabase-js'
