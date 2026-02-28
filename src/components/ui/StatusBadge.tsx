import { cn } from "@/lib/utils";

/* ── Order status ────────────────────────────────────────────────────────── */
type OrderStatus = "received" | "preparing" | "ready" | "served";

const orderStatusConfig: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  received:  { label: "Received",  bg: "bg-blue-500/15",  text: "text-blue-400",  dot: "bg-blue-400" },
  preparing: { label: "Preparing", bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  ready:     { label: "Ready",     bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
  served:    { label: "Served",    bg: "bg-gray-500/15",  text: "text-gray-400",  dot: "bg-gray-400" },
};

/* ── Table status ────────────────────────────────────────────────────────── */
type TableStatus = "empty" | "occupied" | "ordering" | "billing";

const tableStatusConfig: Record<
  TableStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  empty:    { label: "Empty",    bg: "bg-gray-500/15",  text: "text-gray-400",  dot: "bg-gray-400" },
  occupied: { label: "Occupied", bg: "bg-blue-500/15",  text: "text-blue-400",  dot: "bg-blue-400" },
  ordering: { label: "Ordering", bg: "bg-amber-500/15", text: "text-amber-400", dot: "bg-amber-400" },
  billing:  { label: "Billing",  bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
};

/* ── Restaurant status ───────────────────────────────────────────────────── */
type RestaurantStatus = "pending" | "active" | "suspended" | "disabled";

const restaurantStatusConfig: Record<
  RestaurantStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending:   { label: "Pending",   bg: "bg-amber-500/15",  text: "text-amber-400",  dot: "bg-amber-400" },
  active:    { label: "Active",    bg: "bg-green-500/15",  text: "text-green-400",  dot: "bg-green-400" },
  suspended: { label: "Suspended", bg: "bg-red-500/15",    text: "text-red-400",    dot: "bg-red-400" },
  disabled:  { label: "Disabled",  bg: "bg-gray-500/15",   text: "text-gray-400",   dot: "bg-gray-400" },
};

/* ── Tier badge ──────────────────────────────────────────────────────────── */
type TierName = "Basic" | "Standard" | "Premium";

const tierConfig: Record<TierName, { bg: string; text: string }> = {
  Basic:    { bg: "bg-gray-500/15",   text: "text-gray-400" },
  Standard: { bg: "bg-blue-500/15",   text: "text-blue-400" },
  Premium:  { bg: "bg-violet-500/15", text: "text-violet-400" },
};

/* ── Shared badge shell ──────────────────────────────────────────────────── */
interface StatusBadgeShellProps {
  label: string;
  bg: string;
  text: string;
  dot: string;
  pulse?: boolean;
  className?: string;
}

function StatusBadgeShell({ label, bg, text, dot, pulse, className }: StatusBadgeShellProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        bg,
        text,
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0",
          dot,
          pulse && "animate-pulse"
        )}
      />
      {label}
    </span>
  );
}

/* ── Public components ───────────────────────────────────────────────────── */

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}
function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = orderStatusConfig[status] ?? orderStatusConfig.received;
  const pulse = status === "received" || status === "preparing";
  return <StatusBadgeShell {...config} pulse={pulse} className={className} />;
}

interface TableStatusBadgeProps {
  status: TableStatus;
  className?: string;
}
function TableStatusBadge({ status, className }: TableStatusBadgeProps) {
  const config = tableStatusConfig[status] ?? tableStatusConfig.empty;
  const pulse = status === "ordering";
  return <StatusBadgeShell {...config} pulse={pulse} className={className} />;
}

interface RestaurantStatusBadgeProps {
  status: RestaurantStatus;
  className?: string;
}
function RestaurantStatusBadge({ status, className }: RestaurantStatusBadgeProps) {
  const config = restaurantStatusConfig[status] ?? restaurantStatusConfig.pending;
  return <StatusBadgeShell {...config} className={className} />;
}

interface TierBadgeProps {
  tier: TierName | string;
  className?: string;
}
function TierBadge({ tier, className }: TierBadgeProps) {
  const config = tierConfig[tier as TierName] ?? { bg: "bg-gray-500/15", text: "text-gray-400" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      {tier}
    </span>
  );
}

export {
  OrderStatusBadge,
  TableStatusBadge,
  RestaurantStatusBadge,
  TierBadge,
  type OrderStatus,
  type TableStatus,
  type RestaurantStatus,
};
