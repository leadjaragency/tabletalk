import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Building2, ShoppingBag, DollarSign, Star, MessageSquare, Gamepad2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function getData() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekAgo = new Date(todayStart.getTime() - 6 * 86_400_000);

  const [
    restaurantCounts,
    orderStats,
    reviewStats,
    cuisineCounts,
    chatSessionsToday,
    gameWins,
    weeklyOrders,
    recentActivity,
  ] = await Promise.all([
    prisma.restaurant.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.order.aggregate({
      where:  { createdAt: { gte: todayStart } },
      _count: { id: true },
      _sum:   { total: true },
    }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { id: true } }),
    prisma.restaurant.groupBy({
      by:      ["cuisine"],
      where:   { status: "active" },
      _count:  { id: true },
      orderBy: { _count: { id: "desc" } },
      take:    6,
    }),
    prisma.chatSession.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.gameResult.count({ where: { won: true } }),
    prisma.order.findMany({
      where:   { createdAt: { gte: weekAgo } },
      select:  { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // Latest 8 events: newest restaurants + reviews + orders
    prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      take:    4,
      select:  { id: true, name: true, status: true, createdAt: true },
    }),
  ]);

  const statusMap = Object.fromEntries(restaurantCounts.map((r) => [r.status, r._count.id]));

  // Revenue per day (last 7 days)
  const day0   = new Date(todayStart);
  const dayLabels:    string[] = [];
  const revenueByDay: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d      = new Date(day0.getTime() - i * 86_400_000);
    const dayEnd = new Date(d.getTime() + 86_400_000);
    dayLabels.push(d.toLocaleDateString("en-US", { weekday: "short" }));
    const total = weeklyOrders
      .filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= d.getTime() && t < dayEnd.getTime(); })
      .reduce((s, o) => s + o.total, 0);
    revenueByDay.push(total);
  }

  return {
    restaurants:      { active: statusMap["active"] ?? 0, pending: statusMap["pending"] ?? 0, total: restaurantCounts.reduce((s, r) => s + r._count.id, 0) },
    ordersToday:      orderStats._count.id,
    revenueToday:     orderStats._sum.total ?? 0,
    avgRating:        reviewStats._avg.rating ?? 0,
    totalReviews:     reviewStats._count.id,
    aiChatsToday:     chatSessionsToday,
    gameWinsTotal:    gameWins,
    cuisineBreakdown: JSON.parse(JSON.stringify(cuisineCounts)),
    dayLabels,
    revenueByDay,
    recentActivity:   JSON.parse(JSON.stringify(recentActivity)),
  };
}

function BarChart({ labels, values }: { labels: string[]; values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1.5 h-36">
      {labels.map((label, i) => {
        const pct = (values[i] / max) * 100;
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[9px] text-sa-muted leading-none">
              {values[i] > 0 ? `$${values[i].toFixed(0)}` : ""}
            </span>
            <div className="w-full rounded-t-md bg-sa-accent/60" style={{ height: `${Math.max(pct, 3)}%` }} />
            <span className="text-[9px] text-sa-muted">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default async function SuperAdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "super_admin") redirect("/auth/login");

  const {
    restaurants, ordersToday, revenueToday, avgRating, totalReviews,
    aiChatsToday, gameWinsTotal, cuisineBreakdown, dayLabels, revenueByDay, recentActivity,
  } = await getData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-sa-text">Platform Analytics</h1>
        <p className="mt-1 text-sm text-sa-muted">Aggregate stats across all restaurants</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Active",       value: restaurants.active,                                icon: Building2,     color: "bg-emerald-500/15 text-emerald-400" },
          { label: "Orders Today", value: ordersToday,                                       icon: ShoppingBag,   color: "bg-sa-accent/15 text-sa-accent" },
          { label: "Revenue Today",value: `$${revenueToday.toFixed(0)}`,                    icon: DollarSign,    color: "bg-blue-500/15 text-blue-400" },
          { label: "Avg Rating",   value: avgRating > 0 ? avgRating.toFixed(1) : "—",      icon: Star,          color: "bg-amber-500/15 text-amber-400" },
          { label: "AI Chats",     value: aiChatsToday,                                      icon: MessageSquare, color: "bg-purple-500/15 text-purple-400" },
          { label: "Game Wins",    value: gameWinsTotal,                                     icon: Gamepad2,      color: "bg-pink-500/15 text-pink-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-sa-border bg-sa-surface p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-wider text-sa-muted">{label}</p>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-sa-text">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue chart */}
        <div className="lg:col-span-3 rounded-2xl border border-sa-border bg-sa-surface p-5 space-y-4">
          <h2 className="font-display text-base font-semibold text-sa-text">Platform Revenue — Last 7 Days</h2>
          <BarChart labels={dayLabels} values={revenueByDay} />
        </div>

        {/* Cuisine breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-sa-border bg-sa-surface p-5 space-y-4">
          <h2 className="font-display text-base font-semibold text-sa-text">Restaurants by Cuisine</h2>
          {cuisineBreakdown.length === 0 ? (
            <p className="text-sm text-sa-muted">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {cuisineBreakdown.map((c: { cuisine: string; _count: { id: number } }) => (
                <li key={c.cuisine} className="flex items-center justify-between">
                  <span className="text-sm text-sa-text truncate">{c.cuisine}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-sa-accent/15 px-2 py-0.5 text-xs font-semibold text-sa-accent">
                    {c._count.id}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent signups */}
      <div className="rounded-2xl border border-sa-border bg-sa-surface p-5 space-y-4">
        <h2 className="font-display text-base font-semibold text-sa-text">Recent Restaurant Signups</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-sa-muted">No restaurants yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentActivity.map((r: { id: string; name: string; status: string; createdAt: string }) => (
              <div key={r.id} className="rounded-xl border border-sa-border bg-sa-bg p-4 space-y-1">
                <p className="font-medium text-sa-text truncate">{r.name}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${
                  r.status === "active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : r.status === "pending" ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-sa-border text-sa-muted"
                }`}>
                  {r.status}
                </span>
                <p className="text-xs text-sa-muted">
                  {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-sa-border bg-sa-surface/50 px-4 py-3">
        <p className="text-sm text-sa-muted">
          <span className="font-medium text-sa-text">Platform Summary:</span>
          {" "}{restaurants.total} total restaurants ({restaurants.active} active, {restaurants.pending} pending).
          {" "}{totalReviews} total reviews across all restaurants.
        </p>
      </div>
    </div>
  );
}
