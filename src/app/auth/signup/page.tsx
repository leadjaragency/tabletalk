"use client";

import { useState } from "react";
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
  restaurantName: z
    .string()
    .min(2, "Restaurant name must be at least 2 characters")
    .max(100),
  cuisine: z.string().min(2, "Describe your cuisine (e.g. Indian, Italian)").max(100),
  ownerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Input class shared across the form (light-bg override)
// ---------------------------------------------------------------------------

const inputCls =
  "bg-white border-cu-border focus:border-cu-accent/60 focus:ring-cu-accent/20";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(
        (body as { error?: string }).error ??
          "Something went wrong. Please try again."
      );
      return;
    }

    router.push("/auth/pending");
  }

  return (
    <div className="zone-customer min-h-screen flex items-center justify-center bg-cu-bg px-4 py-16">
      <div className="w-full max-w-lg animate-fade-in">

        {/* ── Branding ─────────────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cu-accent/10 ring-1 ring-cu-accent/20">
            <UtensilsCrossed className="h-7 w-7 text-cu-accent" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl text-cu-text tracking-wide">
            ServeMyTable
          </h1>
          <p className="mt-1 text-[10px] font-semibold tracking-[3px] text-cu-accent uppercase">
            TAP . ORDER . ENJOY
          </p>
        </div>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-cu-border bg-white shadow-sm shadow-cu-text/5 px-8 py-9">
          <h2 className="font-display text-xl font-semibold text-cu-text mb-2">
            Create your restaurant account
          </h2>
          <p className="text-sm text-cu-muted mb-8 leading-relaxed">
            Fill in the details below and we&apos;ll review your application
            within 24 hours.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>

            {/* ── Restaurant details ──────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-cu-muted">
                Restaurant details
              </h3>

              <Input
                label="Restaurant name"
                placeholder="Saffron Palace"
                error={errors.restaurantName?.message}
                className={inputCls}
                {...register("restaurantName")}
              />

              <Input
                label="Cuisine type"
                placeholder="Indian, Italian, Japanese…"
                error={errors.cuisine?.message}
                className={inputCls}
                {...register("cuisine")}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Phone (optional)"
                  type="tel"
                  placeholder="+1 555 000 0000"
                  error={errors.phone?.message}
                  className={inputCls}
                  {...register("phone")}
                />
                <Input
                  label="City / Area (optional)"
                  placeholder="New York, NY"
                  error={errors.address?.message}
                  className={inputCls}
                  {...register("address")}
                />
              </div>
            </section>

            {/* Divider */}
            <div className="h-px bg-cu-border" />

            {/* ── Your account ────────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-cu-muted">
                Your account
              </h3>

              <Input
                label="Your full name"
                placeholder="Jane Smith"
                error={errors.ownerName?.message}
                className={inputCls}
                {...register("ownerName")}
              />

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="jane@yourrestaurant.com"
                error={errors.email?.message}
                className={inputCls}
                {...register("email")}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                helperText="Must be at least 8 characters long"
                error={errors.password?.message}
                className={inputCls}
                {...register("password")}
              />
            </section>

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
              className="w-full"
              loading={isSubmitting}
            >
              Request access
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-cu-muted">
            Already have an account?{" "}
            <a
              href="/auth/login"
              className="font-medium text-cu-accent hover:text-cu-accent-hover underline-offset-2 hover:underline transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
