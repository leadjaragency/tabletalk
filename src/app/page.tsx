import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TrialSection from "@/components/landing/TrialSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

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
        <FeaturesSection />
        <HowItWorksSection />
        <TrialSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
