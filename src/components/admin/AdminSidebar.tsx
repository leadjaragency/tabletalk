"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
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
  BarChart2,
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
  userEmail: string;
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
// Restaurant logo/name with dropdown (Fix 1)
// ---------------------------------------------------------------------------

function RestaurantDropdown({
  restaurantName,
  collapsed,
  onClose,
}: {
  restaurantName: string;
  collapsed: boolean;
  onClose?: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <div className={`flex items-center border-b border-ra-border py-4 ${collapsed ? "justify-center px-3" : "gap-3 px-5"}`}>
        <DropdownMenu.Trigger asChild>
          <button
            title="Restaurant options"
            className="flex items-center gap-3 rounded-lg hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ra-accent text-sm font-bold text-ra-bg">
              {restaurantName.charAt(0)}
            </div>
            {!collapsed && (
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-ra-text leading-tight">
                  {restaurantName}
                </p>
                <p className="text-xs text-ra-muted leading-tight">Admin Portal</p>
              </div>
            )}
          </button>
        </DropdownMenu.Trigger>

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

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="right"
          align="start"
          sideOffset={8}
          className="z-[100] w-52 rounded-xl border border-ra-border bg-ra-surface shadow-2xl shadow-black/40 animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="px-3 py-2.5 border-b border-ra-border">
            <p className="text-xs font-semibold text-ra-text truncate">{restaurantName}</p>
            <p className="text-xs text-ra-muted">Restaurant Admin</p>
          </div>

          <div className="p-1.5 space-y-0.5">
            <DropdownMenu.Item asChild>
              <Link
                href="/admin/settings"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ra-muted hover:bg-white/5 hover:text-ra-text transition-colors outline-none cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href="/admin/analytics"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ra-muted hover:bg-white/5 hover:text-ra-text transition-colors outline-none cursor-pointer"
              >
                <BarChart2 className="h-4 w-4" />
                Analytics
              </Link>
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ---------------------------------------------------------------------------
// User profile footer with dropdown + visible sign-out (Fix 2)
// ---------------------------------------------------------------------------

function UserFooter({
  userName,
  userEmail,
  userRole,
  collapsed,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
  collapsed: boolean;
}) {
  const roleLabel = userRole.replace("restaurant_", "");

  if (collapsed) {
    return (
      <div className="border-t border-ra-border p-3 flex justify-center">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          title="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-ra-border p-3 space-y-2">
      {/* Profile dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5 transition-colors focus:outline-none group">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ra-accent/20 text-xs font-bold text-ra-accent">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-medium text-ra-text">{userName}</p>
              <p className="text-xs text-ra-muted capitalize">{roleLabel}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-ra-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="right"
            align="end"
            sideOffset={8}
            className="z-[100] w-56 rounded-xl border border-ra-border bg-ra-surface shadow-2xl shadow-black/40 animate-in fade-in-0 zoom-in-95 duration-100"
          >
            {/* User info header */}
            <div className="px-3 py-3 border-b border-ra-border">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ra-accent/20 text-sm font-bold text-ra-accent">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ra-text truncate">{userName}</p>
                  <p className="text-xs text-ra-muted truncate">{userEmail}</p>
                </div>
              </div>
              <span className="mt-2 inline-flex rounded-full bg-ra-accent/10 px-2 py-0.5 text-[11px] font-medium text-ra-accent capitalize">
                {roleLabel}
              </span>
            </div>

            <div className="p-1.5">
              <DropdownMenu.Item asChild>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ra-muted hover:bg-white/5 hover:text-ra-text transition-colors outline-none cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  Account Settings
                </Link>
              </DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Sign Out — clearly visible red button */}
      <button
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar inner content (shared between desktop + mobile drawers)
// ---------------------------------------------------------------------------

function SidebarContent({
  restaurantName,
  pendingOrdersCount,
  userRole,
  userName,
  userEmail,
  collapsed,
  onClose,
}: {
  restaurantName: string;
  pendingOrdersCount: number;
  userRole: string;
  userName: string;
  userEmail: string;
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
      {/* Logo / Restaurant Name with dropdown */}
      <RestaurantDropdown
        restaurantName={restaurantName}
        collapsed={collapsed}
        onClose={onClose}
      />

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
      <UserFooter
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        collapsed={collapsed}
      />
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
  userEmail,
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
          userEmail={userEmail}
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
          userEmail={userEmail}
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
          userEmail={userEmail}
          collapsed={false}
        />
      </div>
    </>
  );
}
