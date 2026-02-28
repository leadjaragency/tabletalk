"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UtensilsCrossed, MessageCircle, Gamepad2, Receipt, MoreHorizontal } from "lucide-react";
import { useCartStore, selectItemCount } from "@/lib/store";

// ---------------------------------------------------------------------------
// Nav item definition
// ---------------------------------------------------------------------------

interface NavItem {
  label:    string;
  segment:  string; // path segment after /table/[id]/
  icon:     React.ElementType;
  emoji:    string;
  cartBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Menu",  segment: "menu",  icon: UtensilsCrossed, emoji: "📋", cartBadge: true },
  { label: "Chat",  segment: "chat",  icon: MessageCircle,   emoji: "💬" },
  { label: "Games", segment: "games", icon: Gamepad2,        emoji: "🎰" },
  { label: "Bill",  segment: "bill",  icon: Receipt,         emoji: "🧾" },
  { label: "More",  segment: "about", icon: MoreHorizontal,  emoji: "☰" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BottomNavProps {
  tableId:        string;
  restaurantSlug: string;
}

export function BottomNav({ tableId, restaurantSlug }: BottomNavProps) {
  const pathname  = usePathname();
  const cartCount = useCartStore(selectItemCount);

  function buildHref(segment: string) {
    return `/table/${tableId}/${segment}?restaurant=${encodeURIComponent(restaurantSlug)}`;
  }

  function isActive(segment: string) {
    return pathname.includes(`/table/${tableId}/${segment}`);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-cu-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[480px] items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.segment);
          const Icon   = item.icon;

          return (
            <Link
              key={item.segment}
              href={buildHref(item.segment)}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "text-cu-accent"
                  : "text-cu-text/50 hover:text-cu-text/70"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {/* Cart badge on Menu tab */}
                {item.cartBadge && cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-cu-accent text-[9px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>

              {/* Active indicator dot */}
              {active && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-cu-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
