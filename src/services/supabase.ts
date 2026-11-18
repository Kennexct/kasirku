import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Null when env is missing so the app still runs fully offline in local dev.
 * Only the public anon key is ever shipped; RLS enforces per-store access.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;

export function isBackendConfigured(): boolean {
  return supabase !== null;
}
