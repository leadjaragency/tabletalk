import Link from "next/link";
import {
  Building2,
  ShoppingBag,
  TrendingUp,
  Zap,
  Store,
  UtensilsCrossed,
  Star,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Data fetching — all queries run in parallel
// ---------------------------------------------------------------------------

async function getDashboardData() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    activeRestaurantCount,
    pendingCount,
    ordersToday,
    activeRestaurantsWithTier,
    apiCostResult,
    recentSignups,
    recentOrders,
    recentReviews,
  ] = await Promise.all([
    prisma.restaurant.count({ where: { status: "active" } }),

    prisma.restaurant.count({ where: { status: "pending" } }),

    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),

    prisma.restaurant.findMany({
      where: { status: "active" },
      select: { tier: { select: { monthlyPrice: true } } },
    }),

    prisma.aPIUsageLog.aggregate({
      where: { date: { gte: todayStart } },
      _sum: { cost: true },
    }),

    prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        cuisine: true,
        status: true,
        createdAt: true,
      },
    }),

    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        restaurant: { select: { name: true } },
        table: { select: { number: true } },
      },
    }),

    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        restaurant: { select: { name: true } },
      },
    }),
  ]);

  const mrr = activeRestaurantsWithTier.reduce(
    (sum, r) => sum + (r.tier?.monthlyPrice ?? 0),
    0
  );
  const apiCost = apiCostResult._sum.cost ?? 0;

  // Merged + sorted activity feed
  type EventType = "signup" | "order" | "review";

  interface ActivityItem {
    id: string;
    type: EventType;
    title: string;
    meta: string;
    timestamp: Date;
  }

  const activities: ActivityItem[] = [
    ...recentSignups.map((r) => ({
      id: `signup-${r.id}`,
      type: "signup" as EventType,
      title: `${r.name} signed up`,
      meta: `${r.cuisine} · ${r.status}`,
      timestamp: r.createdAt,
    })),
    ...recentOrders.map((o) => ({
      id: `order-${o.id}`,
      type: "order" as EventType,
      title: `Order #${o.orderNumber}`,
      meta: `Table ${o.table.number} · ${o.restaurant.name} · ${formatCurrency(o.total)}`,
      timestamp: o.createdAt,
    })),
    ...recentReviews.map((r) => ({
      id: `review-${r.id}`,
      type: "review" as EventType,
      title: `${r.rating}★ review`,
      meta: `${r.restaurant.name}${r.comment ? ` — "${r.comment.slice(0, 60)}${r.comment.length > 60 ? "…" : ""}"` : ""}`,
      timestamp: r.createdAt,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  return { activeRestaurantCount, pendingCount, ordersToday, mrr, apiCost, activities };
}

// ---------------------------------------------------------------------------
// Stat card component
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconClass: string;
  delay?: number;
}

function StatCard({ title, value, subtitle, icon: Icon, iconClass, delay = 0 }: StatCardProps) {
  return (
    <div
      className="rounded-2xl border border-sa-border bg-sa-surface p-5 flex flex-col gap-3 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-sa-muted">
          {title}
        </p>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="font-display text-3xl font-bold text-sa-text tabular-nums leading-none">
        {value}
      </p>
      <p className="text-xs text-sa-muted leading-snug">{subtitle}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity icon config
// ---------------------------------------------------------------------------

const ACTIVITY_CONFIG = {
  signup: {
    icon: Store,
    bg: "bg-sa-accent/15",
    color: "text-sa-accent",
  },
  order: {
    icon: ShoppingBag,
    bg: "bg-green-500/15",
    color: "text-green-400",
  },
  review: {
    icon: Star,
    bg: "bg-amber-500/15",
    color: "text-amber-400",
  },
} as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SuperAdminOverview() {
  const { activeRestaurantCount, pendingCount, ordersToday, mrr, apiCost, activities } =
    await getDashboardData();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">

      {/* ── Heading ──────────────────────────────────────────────────────────── */}
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-sa-text">Overview</h1>
        <p className="mt-1 text-sm text-sa-muted">
          Platform-wide summary across all restaurants
        </p>
      </div>

      {/* ── Pending approval banner ───────────────────────────────────────────── */}
      {pendingCount > 0 && (
        <Link
          href="/super-admin/approvals"
          className="flex items-center justify-between gap-4 rounded-xl border border-sa-accent/30 bg-sa-accent/10 px-5 py-4 transition-colors hover:bg-sa-accent/15 animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-sa-accent" />
            <p className="text-sm font-medium text-sa-text">
              {pendingCount} restaurant application{pendingCount > 1 ? "s" : ""} waiting
              for your approval
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-sa-accent">
            Review <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Restaurants"
          value={activeRestaurantCount.toString()}
          subtitle={
            pendingCount > 0
              ? `+${pendingCount} pending approval`
              : "All platforms operational"
          }
          icon={Building2}
          iconClass="bg-sa-accent/15 text-sa-accent"
          delay={0}
        />
        <StatCard
          title="Orders Today"
          value={ordersToday.toLocaleString()}
          subtitle="Across all restaurants"
          icon={ShoppingBag}
          iconClass="bg-green-500/15 text-green-400"
          delay={60}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(mrr)}
          subtitle="Sum of active tier prices (MRR)"
          icon={TrendingUp}
          iconClass="bg-amber-500/15 text-amber-400"
          delay={120}
        />
        <StatCard
          title="API Cost Today"
          value={formatCurrency(apiCost)}
          subtitle="Anthropic Claude usage"
          icon={Zap}
          iconClass="bg-red-500/15 text-red-400"
          delay={180}
        />
      </div>

      {/* ── Activity feed + Quick links ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Activity feed (takes 2/3 width on large screens) */}
        <div
          className="lg:col-span-2 rounded-2xl border border-sa-border bg-sa-surface animate-fade-in"
          style={{ animationDelay: "240ms", animationFillMode: "both" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-sa-border px-5 py-4">
            <h2 className="font-display text-base font-semibold text-sa-text">
              Recent Activity
            </h2>
            <div className="flex items-center gap-4 text-[11px] text-sa-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sa-accent inline-block" />
                Signup
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                Order
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                Review
              </span>
            </div>
          </div>

          {/* Items */}
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <UtensilsCrossed className="h-8 w-8 text-sa-muted/30" />
              <p className="text-sm text-sa-muted">
                No activity yet. Place orders or sign up restaurants to see events here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-sa-border/50">
              {activities.map((item) => {
                const cfg = ACTIVITY_CONFIG[item.type];
                const Icon = cfg.icon;
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-sa-text leading-snug">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-sa-muted">
                        {item.meta}
                      </p>
                    </div>
                    <p className="shrink-0 text-[11px] text-sa-muted/60 tabular-nums">
                      {formatTimeAgo(item.timestamp)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer */}
          <div className="border-t border-sa-border px-5 py-3">
            <Link
              href="/super-admin/restaurants"
              className="flex items-center gap-1.5 text-xs font-medium text-sa-muted hover:text-sa-accent transition-colors"
            >
              View all restaurants <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Quick navigation links (1/3) */}
        <div
          className="flex flex-col gap-3 animate-fade-in"
          style={{ animationDelay: "300ms", animationFillMode: "both" }}
        >
          <h2 className="font-display text-base font-semibold text-sa-text px-0.5">
            Quick Actions
          </h2>

          {[
            {
              label: "Manage Restaurants",
              desc: "View, edit, and disable restaurants",
              href: "/super-admin/restaurants",
              icon: Building2,
              badge: 0,
            },
            {
              label: "Review Approvals",
              desc: "Approve or reject new signups",
              href: "/super-admin/approvals",
              icon: AlertCircle,
              badge: pendingCount,
            },
            {
              label: "Billing Overview",
              desc: "Tier assignments and revenue",
              href: "/super-admin/billing",
              icon: TrendingUp,
              badge: 0,
            },
            {
              label: "API Usage",
              desc: "Claude token and cost tracking",
              href: "/super-admin/api-usage",
              icon: Zap,
              badge: 0,
            },
            {
              label: "Analytics",
              desc: "Platform-wide stats and trends",
              href: "/super-admin/analytics",
              icon: Star,
              badge: 0,
            },
          ].map(({ label, desc, href, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-3 rounded-xl border border-sa-border bg-sa-surface p-4 transition-all hover:border-sa-accent/30 hover:bg-white/5"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sa-accent/10 group-hover:bg-sa-accent/20 transition-colors">
                <Icon className="h-4 w-4 text-sa-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-sa-text group-hover:text-sa-text truncate">
                    {label}
                  </p>
                  {badge > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sa-accent px-1 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-sa-muted truncate">{desc}</p>
              </div>
              <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-sa-muted/40 group-hover:text-sa-accent transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
