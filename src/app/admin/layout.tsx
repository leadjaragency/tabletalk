import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Bell, Wifi, WifiOff } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Auth guard ─────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth/login");

  const { role, restaurantId, name: userName } = session.user;

  if (role !== "restaurant_owner" && role !== "restaurant_manager") {
    redirect("/auth/login");
  }

  if (!restaurantId) redirect("/auth/login");

  // ── Restaurant status guard ────────────────────────────────────────────
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      name: true,
      status: true,
      _count: {
        select: {
          orders: { where: { status: { in: ["received", "preparing"] } } },
        },
      },
    },
  });

  if (!restaurant) redirect("/auth/login");

  if (restaurant.status === "pending") redirect("/auth/pending");
  if (restaurant.status === "suspended" || restaurant.status === "disabled") {
    redirect("/auth/login");
  }

  const pendingOrdersCount = restaurant._count.orders;

  // ── POS status (mock — always connected for demo) ──────────────────────
  const posConnected = true;

  return (
    <div className="zone-admin min-h-screen bg-ra-bg text-ra-text">
      {/* Sidebar */}
      <AdminSidebar
        restaurantName={restaurant.name}
        pendingOrdersCount={pendingOrdersCount}
        userRole={role}
        userName={userName ?? "User"}
      />

      {/* Main content — offset for sidebar at each breakpoint */}
      <div className="flex min-h-screen flex-col pl-0 md:pl-[60px] lg:pl-[240px]">
        {/* ── Topbar ──────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ra-border bg-ra-bg/80 px-4 pl-14 backdrop-blur-md md:pl-6">
          {/* Restaurant name (hidden on mobile — hamburger is there instead) */}
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-ra-text leading-tight">
              {restaurant.name}
            </p>
            <p className="text-xs text-ra-muted leading-tight">Restaurant Admin</p>
          </div>
          <div className="md:hidden" />

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* POS connection pill */}
            <div
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                posConnected
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {posConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">
                POS {posConnected ? "Connected" : "Offline"}
              </span>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button className="flex h-8 w-8 items-center justify-center rounded-xl text-ra-muted hover:bg-white/5 hover:text-ra-text transition-colors">
                <Bell className="h-4 w-4" />
              </button>
              {pendingOrdersCount > 0 && (
                <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ra-accent text-[10px] font-bold text-ra-bg">
                  {pendingOrdersCount > 9 ? "9+" : pendingOrdersCount}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
