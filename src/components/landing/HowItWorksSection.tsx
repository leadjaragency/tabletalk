import Image from "next/image";

const steps = [
  {
    number: "01",
    image: "/photos/qr-scan-2.png",
    imageAlt: "Customer scanning QR code at restaurant table with food",
    title: "Guests Scan the QR Code",
    description:
      "A unique QR sits on every table. Guests scan it with any phone — no app, no friction. They are inside your AI waiter experience in under 5 seconds.",
  },
  {
    number: "02",
    image: "/photos/happy-customer-1.png",
    imageAlt: "Happy customers enjoying their meal at a restaurant",
    title: "AI Waiter Chats & Orders",
    description:
      "Your AI waiter greets them instantly, checks for allergies, recommends dishes naturally, upsells drinks and desserts, and confirms their order.",
  },
  {
    number: "03",
    image: "/photos/chef-orders.png",
    imageAlt: "Chef receiving orders directly on a tablet in the kitchen",
    title: "Orders Go Straight to Kitchen",
    description:
      "The moment guests confirm, orders hit the kitchen screen live. No middleman, no lost tickets. Chef taps Ready — guests see it on their phone instantly.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-[#FAF6ED]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold text-[#C6A34E] uppercase tracking-[3px] mb-3">
            How It Works
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-[#1B2A4A] mb-4">
            Up and running in 30 minutes
          </h2>
          <p className="text-[#8B7355] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            No hardware. No app installs. Just a QR code and an AI that knows your menu inside out.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="group flex flex-col rounded-2xl overflow-hidden border border-[#F0E8D6] bg-white shadow-sm hover:shadow-md transition-shadow duration-200">

              {/* Photo with step number overlay */}
              <div className="relative h-52 sm:h-56 overflow-hidden">
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 95vw, (max-width: 1024px) 45vw, 33vw"
                />
                {/* Dark gradient for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/70 via-[#1B2A4A]/10 to-transparent" />

                {/* Step number — bottom left */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <span className="font-display text-5xl text-[#C6A34E] leading-none drop-shadow-md">
                    {step.number}
                  </span>
                </div>

                {/* Connecting arrow — right edge, desktop only */}
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 z-10 -translate-y-1/2 w-8 h-8 rounded-full bg-[#C6A34E] items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-[#1B2A4A]" fill="none" viewBox="0 0 16 16">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-display text-xl text-[#1B2A4A] mb-2">{step.title}</h3>
                <p className="text-sm text-[#8B7355] leading-relaxed flex-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom trust note */}
        <p className="text-center text-sm text-[#8B7355] mt-10">
          <span className="text-[#C6A34E] font-semibold">Setup takes under 30 minutes.</span>{" "}
          No hardware. No IT department. Just your menu and a printer.
        </p>
      </div>
    </section>
  );
}
