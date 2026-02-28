"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  LayoutGrid,
  UtensilsCrossed,
  ShoppingBag,
  Bot,
  QrCode,
  Tag,
  TrendingUp,
  Plug,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Nav item definition
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  hasBadge?: boolean;
  ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",    href: "/admin",             icon: LayoutDashboard, exact: true },
  { label: "Floor Plan",   href: "/admin/tables",      icon: LayoutGrid },
  { label: "Menu Manager", href: "/admin/menu",        icon: UtensilsCrossed },
  { label: "Live Orders",  href: "/admin/orders",      icon: ShoppingBag, hasBadge: true },
  { label: "AI Waiters",   href: "/admin/waiters",     icon: Bot },
  { label: "QR Codes",     href: "/admin/qr-codes",    icon: QrCode },
  { label: "Promotions",   href: "/admin/promotions",  icon: Tag },
  { label: "Analytics",    href: "/admin/analytics",   icon: TrendingUp },
  { label: "POS",          href: "/admin/pos",         icon: Plug },
  { label: "Team",         href: "/admin/team",        icon: Users, ownerOnly: true },
  { label: "Settings",     href: "/admin/settings",    icon: Settings },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdminSidebarProps {
  restaurantName: string;
  pendingOrdersCount: number;
  userRole: string;
  userName: string;
}

// ---------------------------------------------------------------------------
// Single nav link — used in both desktop and mobile drawers
// ---------------------------------------------------------------------------

function NavLink({
  item,
  active,
  badge,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-ra-accent/15 text-ra-accent"
          : "text-ra-muted hover:bg-white/5 hover:text-ra-text"
      } ${collapsed ? "justify-center" : ""}`}
    >
      {/* Active indicator bar */}
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-ra-accent" />
      )}

      <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-ra-accent" : "text-ra-muted group-hover:text-ra-text"}`} />

      {/* Label — hidden when icon-only */}
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}

      {/* Badge */}
      {item.hasBadge && badge && badge > 0 && (
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-ra-accent px-1 text-xs font-bold text-ra-bg ${
            collapsed ? "absolute right-1.5 top-1.5 h-4 min-w-4" : ""
          }`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sidebar inner content (shared between desktop + mobile drawer)
// ---------------------------------------------------------------------------

function SidebarContent({
  restaurantName,
  pendingOrdersCount,
  userRole,
  userName,
  collapsed,
  onClose,
}: {
  restaurantName: string;
  pendingOrdersCount: number;
  userRole: string;
  userName: string;
  collapsed: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.ownerOnly || userRole === "restaurant_owner"
  );

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo / Restaurant Name */}
      <div className={`flex items-center border-b border-ra-border py-4 ${collapsed ? "justify-center px-3" : "gap-3 px-5"}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ra-accent text-sm font-bold text-ra-bg">
          {restaurantName.charAt(0)}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ra-text leading-tight">
              {restaurantName}
            </p>
            <p className="text-xs text-ra-muted leading-tight">Admin Portal</p>
          </div>
        )}
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-ra-muted hover:bg-white/5 hover:text-ra-text"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item)}
            badge={pendingOrdersCount}
            collapsed={collapsed}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* Footer — user info + sign out */}
      <div className={`border-t border-ra-border p-3 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            title="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ra-muted hover:bg-white/5 hover:text-ra-text transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ra-accent/20 text-xs font-bold text-ra-accent">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ra-text">{userName}</p>
              <p className="text-xs text-ra-muted capitalize">
                {userRole.replace("restaurant_", "")}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              title="Sign out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ra-muted hover:bg-white/5 hover:text-ra-text transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AdminSidebar({
  restaurantName,
  pendingOrdersCount,
  userRole,
  userName,
}: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile hamburger trigger ───────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-3.5 z-50 flex h-8 w-8 items-center justify-center rounded-lg bg-ra-surface text-ra-muted hover:text-ra-text md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Mobile drawer overlay ──────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-ra-surface transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          restaurantName={restaurantName}
          pendingOrdersCount={pendingOrdersCount}
          userRole={userRole}
          userName={userName}
          collapsed={false}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* ── Tablet sidebar (icon-only, 60px) ──────────────────────────── */}
      <div className="fixed inset-y-0 left-0 z-30 hidden w-[60px] flex-col border-r border-ra-border bg-ra-surface md:flex lg:hidden">
        <SidebarContent
          restaurantName={restaurantName}
          pendingOrdersCount={pendingOrdersCount}
          userRole={userRole}
          userName={userName}
          collapsed={true}
        />
      </div>

      {/* ── Desktop sidebar (full, 240px) ──────────────────────────────── */}
      <div className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-ra-border bg-ra-surface lg:flex">
        <SidebarContent
          restaurantName={restaurantName}
          pendingOrdersCount={pendingOrdersCount}
          userRole={userRole}
          userName={userName}
          collapsed={false}
        />
      </div>
    </>
  );
}
