import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative bg-[#FAF6ED] pt-20 pb-12 md:pt-28 md:pb-20 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#C6A34E]/6 blur-3xl -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#1B2A4A]/5 blur-3xl translate-y-1/4 -translate-x-1/4" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Left: content ──────────────────────────────── */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#F0E8D6] bg-white text-sm text-[#8B7355] mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#C6A34E] shrink-0" />
              <span>Powered by Claude AI · Calgary, AB</span>
            </div>

            {/* Tagline */}
            <p className="text-[11px] font-semibold tracking-[4px] text-[#C6A34E] uppercase mb-3">
              TAP . ORDER . ENJOY
            </p>

            {/* Headline — Bebas Neue via font-display */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-[#1B2A4A] leading-none mb-5">
              Scan. Order.{" "}
              <span className="text-[#C6A34E]">No Waiter Needed.</span>
            </h1>

            {/* Subheadline — Montserrat via font-sans */}
            <p className="text-base sm:text-lg text-[#8B7355] leading-relaxed mb-8 max-w-lg">
              Your customers scan a QR code, order instantly, and your kitchen gets it in seconds.
              No app download. No waiting. Just revenue.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 h-12 px-6 text-base font-semibold rounded-xl bg-[#C6A34E] text-[#1B2A4A] hover:bg-[#A8873A] hover:text-white transition-colors shadow-md"
              >
                Book a Free Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 h-12 px-6 text-base font-medium rounded-xl border border-[#F0E8D6] text-[#1B2A4A] bg-white/70 hover:bg-white transition-colors"
              >
                See How It Works
              </a>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:flex sm:gap-8 gap-4 pt-5 border-t border-[#F0E8D6]">
              {[
                { value: "-40%",  label: "Labor costs",    color: "text-[#1B2A4A]"  },
                { value: "+34%",  label: "Average bill",   color: "text-[#2D8A56]"  },
                { value: "0",     label: "Allergy errors", color: "text-[#C04525]"  },
                { value: "24/7",  label: "Always on",      color: "text-[#C6A34E]"  },
              ].map((s) => (
                <div key={s.label}>
                  <div className={`font-display text-2xl sm:text-3xl ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-[#8B7355] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: real photo ──────────────────────────── */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[520px]">

              {/* Main photo */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[#1B2A4A]/20 border border-[#F0E8D6]">
                <Image
                  src="/photos/happy-owner.png"
                  alt="Happy restaurant owner using ServeMyTable — Happy Customers, Happy Owners"
                  width={520}
                  height={347}
                  className="w-full h-auto object-cover"
                  priority
                  sizes="(max-width: 640px) 95vw, (max-width: 1024px) 70vw, 520px"
                />
                {/* Subtle gradient overlay so badges are readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating badge — bottom left */}
              <div className="absolute -bottom-4 left-4 sm:-left-4 bg-white rounded-2xl px-3 py-2.5 shadow-xl border border-[#F0E8D6] flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF6ED] flex items-center justify-center text-lg shrink-0">📱</div>
                <div>
                  <div className="font-display text-sm text-[#1B2A4A] leading-none">Zero App</div>
                  <div className="text-[10px] text-[#8B7355] mt-0.5">Just scan & order</div>
                </div>
              </div>

              {/* Floating badge — top right */}
              <div className="absolute -top-4 right-4 sm:-right-4 bg-[#1B2A4A] rounded-2xl px-3 py-2.5 shadow-xl">
                <div className="font-display text-lg text-[#C6A34E] leading-none">24/7</div>
                <div className="text-[10px] text-white/70 mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D8A56] inline-block animate-pulse shrink-0" />
                  AI Always On
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
