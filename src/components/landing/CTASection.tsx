import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#1B2A4A] rounded-3xl overflow-hidden px-8 py-16 md:py-20 text-center">
          {/* Decorative blobs */}
          <div
            className="absolute top-0 left-0 w-72 h-72 bg-[#C6A34E]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-0 w-72 h-72 bg-[#C6A34E]/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <p className="text-[#C6A34E] text-sm font-semibold uppercase tracking-[3px] mb-3">
              TAP . ORDER . ENJOY
            </p>
            <h2 className="font-display text-3xl md:text-5xl text-white mb-4">
              Ready to transform your restaurant?
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
              Join restaurants using ServeMyTable. Set up in under 30 minutes. No credit card
              required to start.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 h-12 px-8 text-base font-semibold rounded-xl bg-[#C6A34E] text-[#1B2A4A] hover:bg-[#A8873A] hover:text-white transition-colors shadow-md"
              >
                Book a Free Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center h-12 px-8 text-base font-medium rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors"
              >
                Log in
              </Link>
            </div>
            <p className="mt-6 text-xs text-white/40">
              Free demo · No contracts · Cancel anytime · Plans from $99/mo
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
