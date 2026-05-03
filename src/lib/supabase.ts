import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ---------------------------------------------------------------------------
// Browser client — safe to import in "use client" components.
// Do NOT import server-only modules (cookies, headers) here.
// ---------------------------------------------------------------------------
export function createBrowserClient() {
  return _createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
