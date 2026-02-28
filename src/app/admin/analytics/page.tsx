import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TrendingUp, Star, Gamepad2, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

async function getData(restaurantId: string) {
  const now   = new Date();
  const day0  = new Date(now); day0.setHours(0, 0, 0, 0);
  const weekAgo = new Date(day0.getTime() - 6 * 86_400_000);

  const [weeklyOrders, topDishItems, recentReviews, allReviews, gameResults] =
    await Promise.all([
      prisma.order.findMany({
        where:   { restaurantId, createdAt: { gte: weekAgo } },
        select:  { total: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.orderItem.groupBy({
        by:      ["dishId"],
        where:   { order: { restaurantId } },
        _sum:    { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take:    8,
      }),
      prisma.review.findMany({
        where:   { restaurantId },
        orderBy: { createdAt: "desc" },
        take:    9,
        include: { session: { select: { table: { select: { number: true } } } } },
      }),
      prisma.review.aggregate({
        where:  { restaurantId },
        _avg:   { rating: true },
        _count: { id: true },
      }),
      prisma.gameResult.aggregate({
        where:  { restaurantId },
        _count: { id: true },
      }),
    ]);

  // Dish names
  const dishIds  = topDishItems.map((d) => d.dishId);
  const dishes   = dishIds.length > 0
    ? await prisma.dish.findMany({
        where:  { id: { in: dishIds } },
        select: { id: true, name: true, imageEmoji: true },
      })
    : [];
  const dishMap  = new Map(dishes.map((d) => [d.id, d]));
  const topDishes = topDishItems
    .map((item) => ({ dish: dishMap.get(item.dishId), quantity: item._sum.quantity ?? 0 }))
    .filter((x) => x.dish);

  // Revenue per day
  const dayLabels:    string[] = [];
  const revenueByDay: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d      = new Date(day0.getTime() - i * 86_400_000);
    const dayEnd = new Date(d.getTime() + 86_400_000);
    const label  = d.toLocaleDateString("en-US", { weekday: "short" });
    dayLabels.push(label);
    const total = weeklyOrders
      .filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= d.getTime() && t < dayEnd.getTime(); })
      .reduce((s, o) => s + o.total, 0);
    revenueByDay.push(total);
  }

  return {
    weekRevenue:      weeklyOrders.reduce((s, o) => s + o.total, 0),
    weeklyOrderCount: weeklyOrders.length,
    avgRating:        allReviews._avg.rating ?? 0,
    totalReviews:     allReviews._count.id,
    totalGamePlays:   gameResults._count.id,
    dayLabels,
    revenueByDay,
    topDishes,
    recentReviews: JSON.parse(JSON.stringify(recentReviews)),
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
            <span className="text-[9px] text-ra-muted leading-none">
              {values[i] > 0 ? `$${values[i].toFixed(0)}` : ""}
            </span>
            <div className="w-full rounded-t-md bg-ra-accent/60" style={{ height: `${Math.max(pct, 3)}%` }} />
            <span className="text-[9px] text-ra-muted">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-sm">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "text-ra-accent" : "text-ra-border"}>★</span>
      ))}
    </span>
  );
}

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.restaurantId) redirect("/auth/login");

  const {
    weekRevenue, weeklyOrderCount, avgRating, totalReviews, totalGamePlays,
    dayLabels, revenueByDay, topDishes, recentReviews,
  } = await getData(session.user.restaurantId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ra-text">Analytics</h1>
        <p className="mt-1 text-sm text-ra-muted">Performance overview for the last 7 days</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Weekly Revenue",  value: `$${weekRevenue.toFixed(2)}`,        icon: TrendingUp, color: "bg-ra-accent/15 text-ra-accent"     },
          { label: "Weekly Orders",   value: weeklyOrderCount,                     icon: ShoppingBag,color: "bg-blue-500/15 text-blue-400"        },
          { label: "Avg Rating",      value: avgRating > 0 ? avgRating.toFixed(1) : "—", sub: `${totalReviews} reviews`, icon: Star, color: "bg-amber-500/15 text-amber-400" },
          { label: "Game Plays",      value: totalGamePlays,                       icon: Gamepad2,   color: "bg-purple-500/15 text-purple-400"    },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-ra-border bg-ra-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-ra-muted">{label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <p className="font-display text-3xl font-bold text-ra-text">{value}</p>
              {sub && <p className="mt-0.5 text-xs text-ra-muted">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-ra-border bg-ra-surface p-5 space-y-4">
          <h2 className="font-display text-base font-semibold text-ra-text">Revenue — Last 7 Days</h2>
          <BarChart labels={dayLabels} values={revenueByDay} />
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-ra-border bg-ra-surface p-5 space-y-4">
          <h2 className="font-display text-base font-semibold text-ra-text">Top Dishes</h2>
          {topDishes.length === 0 ? (
            <p className="text-sm text-ra-muted">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {topDishes.slice(0, 6).map(({ dish, quantity }, i) => (
                <li key={dish!.id} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-center text-xs text-ra-muted font-semibold">{i + 1}</span>
                  <span className="text-base">{dish!.imageEmoji ?? "🍽️"}</span>
                  <span className="flex-1 truncate text-sm text-ra-text">{dish!.name}</span>
                  <span className="shrink-0 rounded-full bg-ra-accent/15 px-2 py-0.5 text-xs font-semibold text-ra-accent">×{quantity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="rounded-2xl border border-ra-border bg-ra-surface p-5 space-y-4">
        <h2 className="font-display text-base font-semibold text-ra-text">Recent Reviews</h2>
        {recentReviews.length === 0 ? (
          <p className="text-sm text-ra-muted">No reviews yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentReviews.map((r: { id: string; rating: number; comment: string | null; createdAt: string; session: { table: { number: number } } }) => (
              <div key={r.id} className="rounded-xl border border-ra-border bg-ra-bg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-ra-muted">Table {r.session.table.number}</span>
                </div>
                <p className={r.comment ? "text-sm text-ra-text/80 line-clamp-3" : "text-sm text-ra-muted italic"}>
                  {r.comment ?? "No comment"}
                </p>
                <p className="text-xs text-ra-muted">
                  {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
