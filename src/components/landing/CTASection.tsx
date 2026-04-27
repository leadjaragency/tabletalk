import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#1B2A4A] rounded-3xl overflow-hidden px-8 py-16 sm:px-14 sm:py-20 text-center">

          {/* Background glow blobs */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-[#C6A34E]/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#C6A34E]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <p className="text-[#C6A34E] text-[11px] font-semibold uppercase tracking-[3px] mb-4">
              TAP . ORDER . ENJOY
            </p>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white mb-5 leading-none">
              Ready to transform<br />your restaurant?
            </h2>
            <p className="text-white/65 text-base leading-relaxed mb-10 max-w-lg mx-auto">
              Set up in under 30 minutes. Start your free 14-day trial today — no credit card, no contracts, no risk.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 h-12 px-8 text-base font-bold uppercase tracking-wider rounded-xl bg-[#C6A34E] text-[#1B2A4A] hover:bg-[#A8873A] hover:text-white transition-colors shadow-lg"
              >
                Start Free Trial
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
              Free 14-day trial · No credit card required · Cancel anytime
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
