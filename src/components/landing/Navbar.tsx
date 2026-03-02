"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, UtensilsCrossed } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E8DFD0]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4740E] flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-[#2D1B0E]">TableTalk</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-[#8B7355] hover:text-[#2D1B0E] transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-[#8B7355] hover:text-[#2D1B0E] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm text-[#8B7355] hover:text-[#2D1B0E] transition-colors"
            >
              Pricing
            </a>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-[#8B7355] hover:text-[#2D1B0E] transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center h-9 px-4 text-sm font-semibold rounded-lg bg-[#D4740E] text-white hover:bg-[#B85C0A] transition-colors shadow-sm"
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-[#2D1B0E] hover:bg-[#E8DFD0] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#E8DFD0] bg-white py-4 flex flex-col gap-1">
            <a
              href="#features"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2 text-sm text-[#2D1B0E] hover:bg-[#FDFBF7] rounded-lg"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2 text-sm text-[#2D1B0E] hover:bg-[#FDFBF7] rounded-lg"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2 text-sm text-[#2D1B0E] hover:bg-[#FDFBF7] rounded-lg"
            >
              Pricing
            </a>
            <div className="mt-3 pt-3 border-t border-[#E8DFD0] flex flex-col gap-2 px-4">
              <Link
                href="/auth/login"
                className="py-2 text-sm text-center text-[#8B7355] hover:text-[#2D1B0E]"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center h-10 px-4 text-sm font-semibold rounded-lg bg-[#D4740E] text-white hover:bg-[#B85C0A] transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
