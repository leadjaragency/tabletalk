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
    <section className="py-20 bg-[#FDFBF7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-[#D4740E] uppercase tracking-wider mb-3">
            Testimonials
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-[#2D1B0E] mb-4">
            Restaurants love TableTalk
          </h2>
          <p className="text-[#8B7355] text-lg">
            Hear from owners who transformed their dining experience.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 border border-[#E8DFD0] shadow-sm flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-base">
                    ★
                  </span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#2D1B0E] text-sm leading-relaxed mb-6 italic flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F5F0E8] flex items-center justify-center text-xl shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2D1B0E]">{t.name}</div>
                  <div className="text-xs text-[#8B7355]">{t.restaurant}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
