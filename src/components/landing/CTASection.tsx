import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#1B2A4A] rounded-3xl overflow-hidden">

          {/* Background glow blobs */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-[#C6A34E]/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#C6A34E]/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" aria-hidden="true" />

          <div className="grid lg:grid-cols-2 items-stretch">

            {/* ── Left: text content ─────────────────────────── */}
            <div className="relative z-10 px-8 py-14 sm:px-12 sm:py-16 flex flex-col justify-center">
              <p className="text-[#C6A34E] text-[11px] font-semibold uppercase tracking-[3px] mb-4">
                TAP . ORDER . ENJOY
              </p>
              <h2 className="font-display text-4xl sm:text-5xl text-white mb-4 leading-none">
                Ready to transform your restaurant?
              </h2>
              <p className="text-white/65 text-base leading-relaxed mb-8 max-w-md">
                Join restaurants using ServeMyTable. Set up in under 30 minutes.
                No credit card required to start.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 h-12 px-7 text-base font-semibold rounded-xl bg-[#C6A34E] text-[#1B2A4A] hover:bg-[#A8873A] hover:text-white transition-colors shadow-lg"
                >
                  Book a Free Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center h-12 px-7 text-base font-medium rounded-xl border border-white/25 text-white hover:bg-white/10 transition-colors"
                >
                  Log in
                </Link>
              </div>

              <p className="mt-6 text-xs text-white/35">
                Free demo · No contracts · Cancel anytime · Plans from $99/mo
              </p>
            </div>

            {/* ── Right: chef image with screen blend ────────── */}
            {/* mix-blend-mode: screen makes the black background invisible on the navy panel */}
            <div className="relative flex items-end justify-center lg:justify-end overflow-hidden min-h-[280px] lg:min-h-0">
              <Image
                src="/photos/chef-promo-2.png"
                alt="Chef proudly presenting ServeMyTable"
                width={440}
                height={440}
                className="relative z-10 object-contain w-full max-w-[360px] lg:max-w-[440px] h-auto"
                style={{ mixBlendMode: "screen" }}
                sizes="(max-width: 1024px) 80vw, 440px"
              />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
