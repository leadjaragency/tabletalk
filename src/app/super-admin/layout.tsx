import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Bell } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SuperAdminSidebar } from "@/components/super-admin/Sidebar";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") {
    redirect("/auth/login");
  }

  // ── Pending count for badge + notification dot ────────────────────────────
  const pendingCount = await prisma.restaurant.count({
    where: { status: "pending" },
  });

  // ── Top-bar date string ───────────────────────────────────────────────────
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="zone-super-admin min-h-screen bg-sa-bg">
      {/* Sidebar (client component — handles mobile toggle + active state) */}
      <SuperAdminSidebar
        pendingCount={pendingCount}
        adminName={session.user.name}
      />

      {/* Main column — offset by sidebar width on desktop */}
      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-sa-border bg-sa-bg/80 backdrop-blur-md px-5">
          {/* Left: spacer for mobile hamburger + title */}
          <div className="flex items-center gap-4">
            <div className="lg:hidden w-8 shrink-0" aria-hidden />
            <span className="font-display text-base font-semibold text-sa-text">
              Super Admin
            </span>
          </div>

          {/* Right: date, notification bell, avatar */}
          <div className="flex items-center gap-3">
            <p className="hidden sm:block text-sm text-sa-muted">{dateStr}</p>

            {/* Notification bell — pings when pending approvals exist */}
            <a
              href="/super-admin/approvals"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-sa-muted hover:text-sa-text hover:bg-white/5 transition-colors"
              aria-label={
                pendingCount > 0
                  ? `${pendingCount} pending approval${pendingCount > 1 ? "s" : ""}`
                  : "Notifications"
              }
            >
              <Bell className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sa-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sa-accent" />
                </span>
              )}
            </a>

            {/* Admin avatar */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-sa-accent/20 text-[11px] font-bold text-sa-accent select-none"
              title={session.user.name}
            >
              SA
            </div>
          </div>
        </header>

        {/* ── Page content ─────────────────────────────────────────────────── */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
