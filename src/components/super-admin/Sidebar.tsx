"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  CreditCard,
  Activity,
  TrendingUp,
  Settings,
  UtensilsCrossed,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Nav items definition
// ---------------------------------------------------------------------------

interface NavDef {
  label: string;
  href: string;
  icon: React.ElementType;
  /** If true, only active on exact match */
  exact?: boolean;
  /** Filled from pendingCount at render time */
  hasBadge?: true;
}

const NAV_ITEMS: NavDef[] = [
  { label: "Overview",    href: "/super-admin",             icon: LayoutDashboard, exact: true },
  { label: "Restaurants", href: "/super-admin/restaurants", icon: Building2 },
  { label: "Approvals",   href: "/super-admin/approvals",   icon: ClipboardCheck,  hasBadge: true },
  { label: "Billing",     href: "/super-admin/billing",     icon: CreditCard },
  { label: "API Usage",   href: "/super-admin/api-usage",   icon: Activity },
  { label: "Analytics",   href: "/super-admin/analytics",   icon: TrendingUp },
  { label: "Settings",    href: "/super-admin/settings",    icon: Settings },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SuperAdminSidebarProps {
  pendingCount: number;
  adminName: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SuperAdminSidebar({ pendingCount, adminName }: SuperAdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const close = () => setMobileOpen(false);

  // ── Shared sidebar content ────────────────────────────────────────────────
  const content = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-sa-border px-5 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sa-accent/15 shrink-0">
          <UtensilsCrossed className="h-4 w-4 text-sa-accent" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-sa-text leading-none truncate">
            TableTalk
          </p>
          <p className="text-[10px] text-sa-muted mt-0.5 uppercase tracking-widest">
            Super Admin
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const badge = item.hasBadge && pendingCount > 0 ? pendingCount : null;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sa-accent text-white shadow-sm shadow-sa-accent/30"
                  : "text-sa-muted hover:text-sa-text hover:bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-white" : "text-sa-muted group-hover:text-sa-text"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {badge != null && (
                <span
                  className={cn(
                    "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-sa-accent text-white"
                  )}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer — user info + sign out */}
      <div className="shrink-0 border-t border-sa-border px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sa-accent/20 text-[11px] font-bold text-sa-accent">
            SA
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-sa-text">{adminName}</p>
            <p className="text-[10px] text-sa-muted">Super Admin</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-sa-muted hover:text-sa-text hover:bg-white/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile hamburger button ───────────────────────────────────────── */}
      <button
        className="lg:hidden fixed top-[13px] left-4 z-50 flex h-8 w-8 items-center justify-center rounded-lg border border-sa-border bg-sa-surface text-sa-text shadow-sm"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* ── Desktop sidebar (always visible ≥ lg) ────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[260px] flex-col border-r border-sa-border bg-sa-surface">
        {content}
      </aside>

      {/* ── Mobile backdrop ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={close}
          aria-hidden
        />
      )}

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col border-r border-sa-border bg-sa-surface",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </aside>
    </>
  );
}
