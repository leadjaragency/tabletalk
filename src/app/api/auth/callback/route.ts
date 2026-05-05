export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// Handles Supabase PKCE auth callbacks (password reset, email confirmation, etc.)
// Supabase sends users here with ?code=... after clicking a link in an email.
// On error (e.g. expired OTP), Supabase sends ?error=...&error_code=... instead.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/login";
  const errorCode = searchParams.get("error_code");

  // Supabase redirected here with an error (expired link, invalid token, etc.)
  if (errorCode === "otp_expired" || searchParams.get("error") === "access_denied") {
    return NextResponse.redirect(`${origin}/auth/forgot-password?error=link_expired`);
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code missing or exchange failed
  return NextResponse.redirect(`${origin}/auth/login?error=invalid_link`);
}
