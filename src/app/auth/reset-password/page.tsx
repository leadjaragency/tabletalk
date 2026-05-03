"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createBrowserClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createBrowserClient();
    const { error: sbError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (sbError) {
      setError("Failed to update password. The reset link may have expired — request a new one.");
      return;
    }

    // Sign out and redirect to login so they use the new password
    await supabase.auth.signOut();
    router.push("/auth/login?reset=success");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FAF6ED", fontFamily: "var(--font-montserrat, sans-serif)" }}
    >
      <div className="w-full max-w-[420px]">

        <div className="flex justify-center mb-8">
          <Image src="/photos/logo-trimmed.png" alt="ServeMyTable" width={180} height={48} className="h-10 w-auto" />
        </div>

        <div
          className="rounded-2xl px-8 py-8 shadow-sm"
          style={{ background: "#FFFFFF", border: "1px solid #F0E8D6" }}
        >
          <div className="mb-7">
            <h2
              className="text-3xl font-black uppercase tracking-wide leading-none mb-2"
              style={{ fontFamily: "var(--font-bebas-neue, sans-serif)", color: "#1B2A4A" }}
            >
              New password
            </h2>
            <p className="text-sm" style={{ color: "#8B7355" }}>
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1B2A4A" }}>
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: "#FAF6ED", border: "1.5px solid #F0E8D6", color: "#1B2A4A" }}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#C6A34E"; }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#F0E8D6"; }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1B2A4A" }}>
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
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
              disabled={loading || !password || !confirm}
              className="w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-all disabled:opacity-60"
              style={{ background: "#C6A34E" }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#A8873A"; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#C6A34E"; }}
            >
              {loading ? "Updating…" : "Set new password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
