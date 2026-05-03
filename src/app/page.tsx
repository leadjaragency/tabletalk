import { getRequiredSession } from "@/lib/auth";
import { redirect } from "next/navigation";


import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LogoMarqueeStrip from "@/components/landing/LogoMarqueeStrip";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import TrialSection from "@/components/landing/TrialSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default async function RootPage() {
  const session = await getRequiredSession();

  if (session) {
    const { role } = session.user;
    if (role === "super_admin") redirect("/super-admin");
    if (role === "restaurant_owner" || role === "restaurant_manager") redirect("/admin");
  }

  return (
    <div className="zone-customer">
      <Navbar />
      <main>
        <HeroSection />
        <LogoMarqueeStrip />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <TrialSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
