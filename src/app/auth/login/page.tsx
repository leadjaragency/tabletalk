"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UtensilsCrossed } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Error message map
// ---------------------------------------------------------------------------

function parseError(error: string): string {
  if (error === "CredentialsSignin") {
    return "Invalid email or password. If your account is pending approval, please wait for our confirmation email.";
  }
  return "Something went wrong. Please try again.";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (!result?.ok || result.error) {
      setServerError(parseError(result?.error ?? "unknown"));
      return;
    }

    // Let the server-side middleware handle the role-based redirect from /
    router.push("/");
    router.refresh();
  }

  return (
    <div className="zone-customer min-h-screen flex items-center justify-center bg-cu-bg px-4 py-16">
      <div className="w-full max-w-sm animate-fade-in">

        {/* ── Branding ─────────────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cu-accent/10 ring-1 ring-cu-accent/20">
            <UtensilsCrossed className="h-7 w-7 text-cu-accent" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl font-bold text-cu-text tracking-tight">
            TableTalk
          </h1>
          <p className="mt-1.5 text-sm text-cu-muted">
            AI-powered waiter for every table
          </p>
        </div>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-cu-border bg-white shadow-sm shadow-cu-text/5 px-8 py-9">
          <h2 className="font-display text-xl font-semibold text-cu-text mb-6">
            Welcome back
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@restaurant.com"
              error={errors.email?.message}
              className="bg-white border-cu-border focus:border-cu-accent/60 focus:ring-cu-accent/20"
              {...register("email")}
            />

            {/* Password */}
            <div>
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                className="bg-white border-cu-border focus:border-cu-accent/60 focus:ring-cu-accent/20"
                {...register("password")}
              />
            </div>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
                <p className="text-sm text-red-700 leading-snug">{serverError}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="warm"
              size="lg"
              className="w-full mt-1"
              loading={isSubmitting}
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-cu-border" />
            <span className="text-xs text-cu-muted">or</span>
            <div className="h-px flex-1 bg-cu-border" />
          </div>

          <p className="text-center text-sm text-cu-muted">
            Restaurant owner?{" "}
            <a
              href="/auth/signup"
              className="font-medium text-cu-accent hover:text-cu-accent-hover underline-offset-2 hover:underline transition-colors"
            >
              Create an account
            </a>
          </p>
        </div>

        {/* ── Footer note ──────────────────────────────────────────────── */}
        <p className="mt-6 text-center text-xs text-cu-muted/70 leading-relaxed">
          By signing in you agree to our{" "}
          <span className="text-cu-muted">Terms of Service</span> and{" "}
          <span className="text-cu-muted">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
