"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Utensils, QrCode, TrendingUp, Star } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

const STATS = [
  { icon: Utensils,   value: "500+",  label: "Restaurants" },
  { icon: QrCode,     value: "50K+",  label: "Orders served" },
  { icon: TrendingUp, value: "38%",   label: "Avg. upsell lift" },
  { icon: Star,       value: "4.9",   label: "Avg. rating" },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const invalidLink = searchParams.get("error") === "invalid_link";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setServerError(
        "Invalid email or password. If your account is pending approval, please wait for our confirmation email."
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-montserrat, sans-serif)" }}>
      <style>{`
        .smt-input:focus { border-color: #C6A34E !important; box-shadow: 0 0 0 3px rgba(198,163,78,0.15); }
      `}</style>

      {/* ── LEFT PANEL — Brand showcase ───────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col overflow-hidden"
        style={{ background: "#1B2A4A" }}
      >
        <div className="absolute inset-0">
          <Image
            src="/photos/happy-owner.png"
            alt="Restaurant owner"
            fill
            className="object-cover object-center"
            sizes="55vw"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(27,42,74,0.92) 0%, rgba(27,42,74,0.75) 50%, rgba(27,42,74,0.88) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          <div>
            <Image
              src="/photos/logo-trimmed.png"
              alt="ServeMyTable"
              width={200}
              height={52}
              className="h-11 w-auto object-contain object-left"
              sizes="200px"
            />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p
              className="text-xs font-semibold uppercase tracking-[0.25em] mb-4"
              style={{ color: "#C6A34E" }}
            >
              AI-Powered Restaurant Platform
            </p>
            <h1
              className="text-5xl xl:text-6xl font-black uppercase leading-none tracking-wide text-white mb-5"
              style={{ fontFamily: "var(--font-bebas-neue, sans-serif)" }}
            >
              The Smarter <br />
              <span style={{ color: "#C6A34E" }}>Way to</span> Serve
            </h1>
            <p className="text-base leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.65)" }}>
              Your AI waiter takes orders, upsells naturally, handles allergen checks, and keeps guests engaged — all from a QR scan.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-10 max-w-sm">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(198,163,78,0.25)" }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "rgba(198,163,78,0.2)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "#C6A34E" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none">{value}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" style={{ color: "#C6A34E" }} />
              ))}
            </div>
            <p className="text-sm italic leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
              &ldquo;Our order errors dropped to zero and average bill size went up 22% in the first month. The AI waiter genuinely feels like part of our team.&rdquo;
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "#C6A34E" }}
              >
                RK
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Raj Kumar</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>Owner, Saffron Palace · Calgary</p>
              </div>
            </div>
          </div>

          <p
            className="mt-6 text-xs font-semibold tracking-[0.3em] uppercase"
            style={{ color: "rgba(198,163,78,0.6)" }}
          >
            TAP . ORDER . ENJOY
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login form ───────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col"
        style={{ background: "#FAF6ED" }}
      >
        <div className="px-8 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: "#8B7355" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1B2A4A")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#8B7355")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-[400px]">

            <div className="lg:hidden mb-8 flex justify-center">
              <Image
                src="/photos/logo-trimmed.png"
                alt="ServeMyTable"
                width={200}
                height={52}
                className="h-12 w-auto object-contain"
                sizes="200px"
                priority
              />
            </div>

            <div className="mb-8">
              <h2
                className="text-3xl font-black uppercase tracking-wide leading-none mb-2"
                style={{
                  fontFamily: "var(--font-bebas-neue, sans-serif)",
                  color: "#1B2A4A",
                }}
              >
                Welcome Back
              </h2>
              <p className="text-sm" style={{ color: "#8B7355" }}>
                Sign in to your ServeMyTable dashboard
              </p>
            </div>

            {resetSuccess && (
              <div
                className="mb-5 rounded-xl px-4 py-3 text-sm"
                style={{ background: "#F0FDF4", border: "1px solid #86EFAC", color: "#166534" }}
              >
                Password updated successfully. Sign in with your new password.
              </div>
            )}

            {invalidLink && (
              <div
                className="mb-5 rounded-xl px-4 py-3 text-sm"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#C04525" }}
              >
                This reset link is invalid or has expired. Please request a new one.
              </div>
            )}

            <div
              className="rounded-2xl px-8 py-8 shadow-sm"
              style={{
                background: "#FFFFFF",
                border: "1px solid #F0E8D6",
              }}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1B2A4A" }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@restaurant.com"
                    className="smt-input w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{ background: "#FAF6ED", border: "1.5px solid #F0E8D6", color: "#1B2A4A" }}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs" style={{ color: "#C04525" }}>{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "#1B2A4A" }}>
                      Password
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-medium transition-colors"
                      style={{ color: "#C6A34E" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#A8873A")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#C6A34E")}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="smt-input w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{ background: "#FAF6ED", border: "1.5px solid #F0E8D6", color: "#1B2A4A" }}
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-xs" style={{ color: "#C04525" }}>{errors.password.message}</p>
                  )}
                </div>

                {/* Server error */}
                {serverError && (
                  <div
                    className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                    style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
                  >
                    <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#C04525" }} viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                    <p className="text-sm leading-snug" style={{ color: "#C04525" }}>{serverError}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-all mt-1 disabled:opacity-60"
                  style={{ background: isSubmitting ? "#A8873A" : "#C6A34E" }}
                  onMouseEnter={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = "#A8873A"; }}
                  onMouseLeave={(e) => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = "#C6A34E"; }}
                >
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: "#F0E8D6" }} />
                <span className="text-xs" style={{ color: "#8B7355" }}>or</span>
                <div className="h-px flex-1" style={{ background: "#F0E8D6" }} />
              </div>

              <p className="text-center text-sm" style={{ color: "#8B7355" }}>
                Restaurant owner?{" "}
                <Link
                  href="/auth/signup"
                  className="font-semibold transition-colors"
                  style={{ color: "#C6A34E" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#A8873A")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#C6A34E")}
                >
                  Create an account
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: "#8B7355" }}>
              By signing in you agree to our{" "}
              <span className="font-medium" style={{ color: "#1B2A4A" }}>Terms of Service</span>
              {" "}and{" "}
              <span className="font-medium" style={{ color: "#1B2A4A" }}>Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
