import Image from "next/image";

const testimonials = [
  {
    name: "Raj Malhotra",
    restaurant: "Spice Garden, Toronto",
    stars: 5,
    avatar: "👨‍🍳",
    quote:
      "Our guests love chatting with the AI waiter. Allergen questions used to slow down my team every service — now guests get instant, accurate answers before they even order.",
  },
  {
    name: "Sarah Chen",
    restaurant: "The Golden Bowl, Vancouver",
    stars: 5,
    avatar: "👩‍🍳",
    quote:
      "Setup took 20 minutes. Within the first week, our table turn time dropped noticeably because guests were already browsing and chatting before our staff even arrived.",
  },
  {
    name: "Priya Nair",
    restaurant: "Coconut Grove, Calgary",
    stars: 5,
    avatar: "🧑‍🍳",
    quote:
      "The games feature is brilliant. Families with kids love the spin wheel, and we have seen a real uptick in dessert orders from the discount prizes guests win.",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-[#FAF6ED]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Visual header strip ───────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden mb-14 h-52 sm:h-64">
          <Image
            src="/photos/happy-customer-2.png"
            alt="Happy customers enjoying an evening at a restaurant"
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 95vw, (max-width: 1280px) 90vw, 1152px"
          />
          {/* Navy overlay for text legibility */}
          <div className="absolute inset-0 bg-[#1B2A4A]/65" />

          {/* Centered text over image */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-[11px] font-semibold text-[#C6A34E] uppercase tracking-[3px] mb-3">
              Testimonials
            </p>
            <h2 className="font-display text-4xl sm:text-5xl text-white mb-2">
              Restaurants love ServeMyTable
            </h2>
            <p className="text-white/70 text-sm sm:text-base max-w-md leading-relaxed">
              Hear from owners who transformed their dining experience.
            </p>
          </div>
        </div>

        {/* ── Testimonial cards ─────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 border border-[#F0E8D6] shadow-sm flex flex-col hover:shadow-md transition-shadow duration-200"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-[#C6A34E] text-base">★</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#1B2A4A] text-sm leading-relaxed mb-6 italic flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FAF6ED] border border-[#F0E8D6] flex items-center justify-center text-xl shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#1B2A4A]">{t.name}</div>
                  <div className="text-xs text-[#8B7355]">{t.restaurant}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Review CTA strip ──────────────────────────────── */}
        <div className="mt-10 rounded-2xl overflow-hidden border border-[#F0E8D6]">
          <div className="grid sm:grid-cols-2 items-center">
            {/* Image side */}
            <div className="relative h-48 sm:h-full min-h-[160px]">
              <Image
                src="/photos/review.png"
                alt="Customer leaving a 5-star restaurant review on their phone"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 95vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1B2A4A]/10" />
            </div>
            {/* Text side */}
            <div className="bg-[#1B2A4A] p-6 sm:p-8">
              <div className="font-display text-3xl sm:text-4xl text-[#C6A34E] mb-2">Auto Google Reviews</div>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                After every meal, ServeMyTable prompts happy guests to leave a Google review. More reviews, higher ranking, more customers.
              </p>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-[#C6A34E] text-lg">★</span>
                ))}
                <span className="text-white/50 text-sm ml-2 self-center">· Free marketing</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
