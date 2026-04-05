import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative bg-[#FDFBF7] pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#C6A34E]/8 blur-3xl -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#1B2A4A]/5 blur-3xl translate-y-1/4 -translate-x-1/4" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#F0E8D6] bg-white text-sm text-[#8B7355] mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#C6A34E]" />
              <span>Powered by Claude AI · Calgary, AB</span>
            </div>

            {/* Tagline */}
            <p className="text-xs font-semibold tracking-[4px] text-[#C6A34E] uppercase mb-3">
              TAP . ORDER . ENJOY
            </p>

            {/* Headline */}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-[#1B2A4A] leading-none mb-6">
              Scan. Order.{" "}
              <span className="text-[#C6A34E]">No Waiter Needed.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-[#8B7355] leading-relaxed mb-8 max-w-xl">
              Your customers scan a QR code, order instantly, and your kitchen gets it in
              seconds. No app download. No waiting. Just revenue.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 h-12 px-6 text-base font-semibold rounded-xl bg-[#C6A34E] text-[#1B2A4A] hover:bg-[#A8873A] hover:text-white transition-colors shadow-md"
              >
                Book a Free Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 h-12 px-6 text-base font-medium rounded-xl border border-[#F0E8D6] text-[#1B2A4A] hover:bg-[#F0E8D6]/50 transition-colors"
              >
                See How It Works
              </a>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-8">
              {[
                { value: "-40%", label: "Labor costs" },
                { value: "+34%", label: "Average bill" },
                { value: "0", label: "Allergy errors" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-2xl text-[#1B2A4A]">{stat.value}</div>
                  <div className="text-sm text-[#8B7355]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-[280px] h-[560px] bg-[#1B2A4A] rounded-[40px] p-3 shadow-2xl">
                <div className="w-full h-full bg-[#FDFBF7] rounded-[32px] overflow-hidden flex flex-col">
                  {/* Chat header */}
                  <div className="bg-[#1B2A4A] px-4 py-3 flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
                      👨‍🍳
                    </div>
                    <div>
                      <div className="text-white text-xs font-semibold">Arjun — Table 5</div>
                      <div className="text-white/70 text-[10px]">Online · Saffron Palace</div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-3 space-y-3 overflow-hidden">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1B2A4A] flex items-center justify-center text-xs shrink-0">
                        👨‍🍳
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 max-w-[160px] shadow-sm">
                        <p className="text-[10px] text-[#1B2A4A]">
                          Welcome! Any food allergies I should know about? 🌿
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-[#C6A34E] rounded-2xl rounded-tr-none px-3 py-2 max-w-[150px]">
                        <p className="text-[10px] text-white">I&apos;m allergic to nuts</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1B2A4A] flex items-center justify-center text-xs shrink-0">
                        👨‍🍳
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 max-w-[165px] shadow-sm">
                        <p className="text-[10px] text-[#1B2A4A]">
                          Got it! Try our Butter Chicken — completely nut-free and a
                          guest favourite! 🍛
                        </p>
                      </div>
                    </div>

                    {/* Order card */}
                    <div className="bg-white rounded-xl p-2.5 shadow-sm border border-[#E8DFD0]">
                      <div className="text-[9px] font-semibold text-[#8B7355] mb-1.5 uppercase tracking-wider">
                        Order Confirmed
                      </div>
                      <div className="text-[10px] text-[#1B2A4A]">1× Butter Chicken</div>
                      <div className="text-[10px] text-[#1B2A4A]">1× Garlic Naan</div>
                      <div className="text-[10px] font-bold text-[#C6A34E] mt-1.5">$24.50</div>
                    </div>

                    {/* Quick replies */}
                    <div className="flex gap-1.5 flex-wrap">
                      {["View Menu", "Call Bill"].map((r) => (
                        <div
                          key={r}
                          className="px-2 py-1 rounded-full border border-[#D4740E]/40 text-[9px] text-[#C6A34E]"
                        >
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Input bar */}
                  <div className="border-t border-[#E8DFD0] px-3 py-2 flex items-center gap-2 shrink-0">
                    <div className="flex-1 bg-[#F5F0E8] rounded-full px-3 py-1.5">
                      <span className="text-[10px] text-[#8B7355]">Message Arjun...</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-[#C6A34E] flex items-center justify-center shrink-0">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* QR badge */}
              <div className="absolute -left-14 top-20 bg-white rounded-2xl p-3 shadow-lg border border-[#E8DFD0]">
                <div className="w-12 h-12 bg-[#F5F0E8] rounded-lg flex items-center justify-center text-2xl">
                  📱
                </div>
                <div className="text-[10px] text-[#8B7355] mt-1 text-center font-medium">
                  Scan QR
                </div>
              </div>

              {/* Live status badge */}
              <div className="absolute -right-12 bottom-28 bg-white rounded-2xl px-3 py-2.5 shadow-lg border border-[#E8DFD0]">
                <div className="text-xs font-bold text-[#1B2A4A]">12 tables</div>
                <div className="text-[10px] text-[#1B8C3A] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B8C3A] inline-block" />
                  All active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
