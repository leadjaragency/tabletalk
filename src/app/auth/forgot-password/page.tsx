"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const { error: sbError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);
    if (sbError) {
      setError("Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FAF6ED", fontFamily: "var(--font-montserrat, sans-serif)" }}
    >
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/photos/logo-trimmed.png" alt="ServeMyTable" width={180} height={48} className="h-10 w-auto" />
        </div>

        {submitted ? (
          /* ── Success state ─────────────────────────────────────────── */
          <div
            className="rounded-2xl px-8 py-10 shadow-sm text-center"
            style={{ background: "#FFFFFF", border: "1px solid #F0E8D6" }}
          >
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "rgba(198,163,78,0.12)" }}
            >
              <Mail className="h-7 w-7" style={{ color: "#C6A34E" }} />
            </div>
            <h2
              className="text-2xl font-black uppercase tracking-wide mb-2"
              style={{ fontFamily: "var(--font-bebas-neue, sans-serif)", color: "#1B2A4A" }}
            >
              Check your inbox
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#8B7355" }}>
              We sent a password reset link to <strong style={{ color: "#1B2A4A" }}>{email}</strong>.
              Click the link in the email to set a new password.
            </p>
            <p className="text-xs" style={{ color: "#8B7355" }}>
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => setSubmitted(false)}
                className="font-semibold underline"
                style={{ color: "#C6A34E" }}
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          /* ── Form state ────────────────────────────────────────────── */
          <div
            className="rounded-2xl px-8 py-8 shadow-sm"
            style={{ background: "#FFFFFF", border: "1px solid #F0E8D6" }}
          >
            <div className="mb-7">
              <h2
                className="text-3xl font-black uppercase tracking-wide leading-none mb-2"
                style={{ fontFamily: "var(--font-bebas-neue, sans-serif)", color: "#1B2A4A" }}
              >
                Reset password
              </h2>
              <p className="text-sm" style={{ color: "#8B7355" }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1B2A4A" }}>
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@restaurant.com"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ background: "#FAF6ED", border: "1.5px solid #F0E8D6", color: "#1B2A4A" }}
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#C6A34E"; }}
                  onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#F0E8D6"; }}
                />
              </div>

              {error && (
                <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#FEF2F2", color: "#C04525", border: "1px solid #FECACA" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-all disabled:opacity-60"
                style={{ background: "#C6A34E" }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#A8873A"; }}
                onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#C6A34E"; }}
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </div>
        )}

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "#8B7355" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1B2A4A")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#8B7355")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
