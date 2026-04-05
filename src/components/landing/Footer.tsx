import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1B2A4A] text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-white/10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#C6A34E] flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-[#1B2A4A]" />
              </div>
              <div>
                <span className="font-display text-xl text-[#C6A34E] tracking-wide">ServeMyTable</span>
                <p className="text-[9px] font-semibold tracking-[3px] text-white/50 uppercase mt-0.5">TAP . ORDER . ENJOY</p>
              </div>
            </div>
            <p className="text-white/60 text-sm max-w-xs leading-relaxed">
              AI-powered virtual waiters for restaurants. From QR scan to Google review.
            </p>
            <div className="mt-4 text-xs text-white/40 space-y-0.5">
              <p>hello@servemytable.com</p>
              <p>servemytable.com · Calgary, AB, Canada</p>
            </div>
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
          <span>© 2026 ServeMyTable. All rights reserved. Powered by <a href="https://leadjar.ca" className="hover:text-white/70 transition-colors">LeadJar Agency</a>.</span>
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
