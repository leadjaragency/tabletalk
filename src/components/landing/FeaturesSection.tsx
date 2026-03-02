const features = [
  {
    emoji: "🤖",
    title: "AI Waiter Chat",
    description:
      "Natural conversation in 14 languages. Guests chat just like messaging a friend — no learning curve, no app download.",
    bg: "#FEF3E2",
  },
  {
    emoji: "🥜",
    title: "Allergen Safety First",
    description:
      "Never recommends a dish that conflicts with stated allergies. Flags every relevant item proactively — your guests stay safe.",
    bg: "#FDE8EC",
  },
  {
    emoji: "📱",
    title: "QR Code Ordering",
    description:
      "No app download required. Guests scan, chat, and order in under 60 seconds from any smartphone.",
    bg: "#E6F5EC",
  },
  {
    emoji: "🎮",
    title: "Guest Entertainment",
    description:
      "Spin wheel, food trivia, and bill estimator reduce wait frustration — and earn guests discount rewards on their bill.",
    bg: "#EEF2FF",
  },
  {
    emoji: "📊",
    title: "Live Admin Dashboard",
    description:
      "Real-time orders, revenue tracking, and AI conversation analytics all in one dashboard. Know your restaurant inside out.",
    bg: "#E0F7FA",
  },
  {
    emoji: "🌐",
    title: "Multi-Language Support",
    description:
      "English, Hindi, French, Spanish, Arabic, Mandarin, and 8 more. Serve every guest in their preferred language.",
    bg: "#F3EFFE",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-[#D4740E] uppercase tracking-wider mb-3">
            Features
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-[#2D1B0E] mb-4">
            Everything your restaurant needs
          </h2>
          <p className="text-[#8B7355] text-lg max-w-2xl mx-auto">
            One platform to run your front-of-house — from the moment guests scan the QR code
            to the final bill.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl border border-[#E8DFD0] hover:shadow-md hover:border-[#D4740E]/30 transition-all duration-200"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ backgroundColor: feature.bg }}
              >
                {feature.emoji}
              </div>
              <h3 className="font-display text-lg text-[#2D1B0E] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#8B7355] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
