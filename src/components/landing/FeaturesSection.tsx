import Image from "next/image";
import { MessageSquare, ShieldCheck, QrCode, Gamepad2, BarChart3, Globe } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Waiter Chat",
    description:
      "Natural conversation in 14 languages. Guests chat just like messaging a friend — no learning curve, no app download.",
    iconColor: "#C6A34E",
    iconBg: "#FEF3E2",
  },
  {
    icon: ShieldCheck,
    title: "Allergen Safety First",
    description:
      "Never recommends a dish that conflicts with stated allergies. Flags every relevant item proactively — your guests stay safe.",
    iconColor: "#C04525",
    iconBg: "#FDE8EC",
  },
  {
    icon: QrCode,
    title: "QR Code Ordering",
    description:
      "No app download required. Guests scan, chat, and order in under 60 seconds from any smartphone.",
    iconColor: "#2D8A56",
    iconBg: "#E6F5EC",
  },
  {
    icon: Gamepad2,
    title: "Guest Entertainment",
    description:
      "Spin wheel, food trivia, and bill estimator reduce wait frustration — and earn guests discount rewards on their bill.",
    iconColor: "#4F46E5",
    iconBg: "#EEF2FF",
  },
  {
    icon: BarChart3,
    title: "Live Admin Dashboard",
    description:
      "Real-time orders, revenue tracking, and AI conversation analytics all in one dashboard. Know your restaurant inside out.",
    iconColor: "#0891B2",
    iconBg: "#E0F7FA",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description:
      "English, Hindi, French, Spanish, Arabic, Mandarin, and 8 more. Serve every guest in their preferred language.",
    iconColor: "#7C3AED",
    iconBg: "#F3EFFE",
  },
];

const proofImages = [
  {
    src: "/photos/happy-customer-2.png",
    alt: "Groups of happy customers enjoying their evening at a restaurant",
    label: "Happy Guests",
    stat: "Every Night",
  },
  {
    src: "/photos/analytics.png",
    alt: "Restaurant food analytics and sales charts",
    label: "Smart Analytics",
    stat: "Real-Time",
  },
  {
    src: "/photos/review.png",
    alt: "Customer leaving a 5-star review on their phone",
    label: "Auto Reviews",
    stat: "5-Star Results",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-[11px] font-semibold text-[#C6A34E] uppercase tracking-[3px] mb-3">
            Features
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-[#1B2A4A] mb-4">
            Everything your restaurant needs
          </h2>
          <p className="text-[#8B7355] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            One platform to run your front-of-house — from the moment guests scan the QR code to the final bill.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-[#F0E8D6] hover:shadow-md hover:border-[#C6A34E]/30 transition-all duration-200"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: feature.iconBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: feature.iconColor }} />
                </div>
                <h3 className="font-display text-xl text-[#1B2A4A] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#8B7355] leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* ── Visual proof strip ─────────────────────────── */}
        <div className="mt-16">
          <p className="text-center text-[11px] font-semibold text-[#C6A34E] uppercase tracking-[3px] mb-6">
            Seen in action
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {proofImages.map((img) => (
              <div key={img.label} className="group relative rounded-2xl overflow-hidden h-52 sm:h-60 shadow-sm border border-[#F0E8D6]">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 95vw, (max-width: 1024px) 45vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A]/80 via-[#1B2A4A]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="font-display text-xl text-white leading-none">{img.label}</div>
                  <div className="text-[11px] text-[#C6A34E] font-semibold mt-1 tracking-wider">{img.stat}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
