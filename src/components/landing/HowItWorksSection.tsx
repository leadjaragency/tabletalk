const steps = [
  {
    number: "01",
    emoji: "🖨️",
    title: "Print & Place QR Codes",
    description:
      "Generate a unique QR code for every table in one click. Download as a PDF and print. That is your entire setup.",
  },
  {
    number: "02",
    emoji: "💬",
    title: "Guests Scan & Chat",
    description:
      "Your AI waiter greets them instantly, checks for allergies, learns their preferences, and recommends dishes naturally.",
  },
  {
    number: "03",
    emoji: "🍳",
    title: "Orders Flow to Kitchen",
    description:
      "Orders appear live in your admin dashboard the moment guests confirm. No lost tickets, no miscommunication.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-[#FDFBF7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-[#D4740E] uppercase tracking-wider mb-3">
            How It Works
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-[#2D1B0E] mb-4">
            Up and running in 30 minutes
          </h2>
          <p className="text-[#8B7355] text-lg max-w-xl mx-auto">
            No hardware. No app installs. Just a QR code and an AI that knows your menu
            inside out.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-10 relative">
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-10 h-px bg-[#E8DFD0]"
            style={{ left: "calc(16.67% + 2.5rem)", right: "calc(16.67% + 2.5rem)" }}
            aria-hidden="true"
          />

          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Icon + number */}
              <div className="relative z-10 w-20 h-20 rounded-2xl bg-white border-2 border-[#E8DFD0] flex flex-col items-center justify-center mb-6 shadow-sm">
                <span className="text-2xl">{step.emoji}</span>
                <span className="text-[10px] font-bold text-[#D4740E] mt-0.5">{step.number}</span>
              </div>

              <h3 className="font-display text-xl text-[#2D1B0E] mb-3">{step.title}</h3>
              <p className="text-sm text-[#8B7355] leading-relaxed max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
