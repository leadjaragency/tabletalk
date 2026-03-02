import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#2D1B0E] text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-white/10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#D4740E] flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl">TableTalk</span>
            </div>
            <p className="text-white/60 text-sm max-w-xs leading-relaxed">
              AI-powered virtual waiters for restaurants. QR code dining, reimagined.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/90">Product</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-white transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Account links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/90">Account</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>
                <Link href="/auth/login" className="hover:text-white transition-colors">
                  Restaurant Login
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/auth/pending" className="hover:text-white transition-colors">
                  Check Application Status
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <span>© 2025 TableTalk. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white/70 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white/70 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
