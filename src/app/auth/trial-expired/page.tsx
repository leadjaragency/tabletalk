"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Mail } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TrialExpiredPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FAF6ED", fontFamily: "var(--font-montserrat, sans-serif)" }}
    >
      <div className="w-full max-w-[480px] text-center">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/photos/logo-trimmed.png" alt="ServeMyTable" width={180} height={48} className="h-10 w-auto" />
        </div>

        <div
          className="rounded-2xl px-8 py-10 shadow-sm"
          style={{ background: "#FFFFFF", border: "1px solid #F0E8D6" }}
        >
          {/* Icon */}
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "rgba(198,163,78,0.1)", border: "2px solid rgba(198,163,78,0.3)" }}
          >
            <Clock className="h-8 w-8" style={{ color: "#C6A34E" }} />
          </div>

          <h2
            className="text-3xl font-black uppercase tracking-wide mb-3"
            style={{ fontFamily: "var(--font-bebas-neue, sans-serif)", color: "#1B2A4A" }}
          >
            Your trial has ended
          </h2>

          <p className="text-sm leading-relaxed mb-2" style={{ color: "#8B7355" }}>
            Your 14-day free trial of ServeMyTable has expired. Your restaurant data is safe and preserved.
          </p>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "#8B7355" }}>
            Upgrade to a paid plan to restore full access and keep your AI waiter running.
          </p>

          {/* CTA */}
          <a
            href="mailto:hello@servemytable.ca?subject=Upgrade%20my%20ServeMyTable%20account"
            className="block w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-all mb-3"
            style={{ background: "#C6A34E" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#A8873A"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#C6A34E"; }}
          >
            Contact us to upgrade
          </a>

          <div className="flex items-center justify-center gap-2 text-sm mb-8" style={{ color: "#8B7355" }}>
            <Mail className="h-4 w-4" />
            <a href="mailto:hello@servemytable.ca" style={{ color: "#C6A34E" }}>
              hello@servemytable.ca
            </a>
          </div>

          <div className="pt-6" style={{ borderTop: "1px solid #F0E8D6" }}>
            <p className="text-xs mb-3" style={{ color: "#8B7355" }}>
              Not ready to upgrade? Your data is kept for 30 days.
            </p>
            <button
              onClick={handleSignOut}
              className="text-xs font-medium transition-colors"
              style={{ color: "#8B7355" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1B2A4A")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#8B7355")}
            >
              Sign out
            </button>
          </div>
        </div>

        <p className="mt-6 text-xs" style={{ color: "#8B7355" }}>
          Powered by{" "}
          <Link href="https://leadjar.ca" target="_blank" className="font-medium" style={{ color: "#1B2A4A" }}>
            LeadJar Agency
          </Link>
        </p>
      </div>
    </div>
  );
}
