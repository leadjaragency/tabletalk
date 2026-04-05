"use client";

import { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Clock, Loader2, ArrowRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface RecentOrder {
  id:          string;
  orderNumber: string;
  status:      string;
  total:       number;
  posSynced:   boolean;
  createdAt:   string;
  table:       { number: number };
}

interface PosData {
  connected:     boolean;
  syncedToday:   number;
  unsyncedCount: number;
  recentOrders:  RecentOrder[];
  provider:      string;
  lastSync:      string;
}

function statusBadge(status: string) {
  switch (status) {
    case "received":  return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    case "preparing": return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    case "ready":     return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    default:          return "border-ra-border bg-ra-surface text-ra-muted";
  }
}

const FLOW_STAGES = [
  { icon: "📱", label: "Customer Orders",  desc: "Via QR chat or menu" },
  { icon: "📬", label: "Order Received",   desc: "Saved to ServeMyTable DB" },
  { icon: "🔄", label: "POS Sync",         desc: "Forwarded to POS" },
  { icon: "👨‍🍳", label: "Kitchen",          desc: "Prepared by staff" },
  { icon: "🍽️", label: "Served",           desc: "Delivered to table" },
];

export default function PosPage() {
  const [data,    setData]    = useState<PosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pos");
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res  = await fetch("/api/pos", { method: "POST" });
      const body = await res.json();
      if (res.ok) {
        await load();
        alert(`${body.synced} order(s) synced to POS.`);
      }
    } catch { /* ignore */ }
    finally { setSyncing(false); }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ra-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ra-text">POS Integration</h1>
        <p className="mt-1 text-sm text-ra-muted">Point-of-sale connection and order sync</p>
      </div>

      {/* Connection card */}
      <div className="rounded-2xl border border-ra-border bg-ra-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl",
              data?.connected ? "bg-emerald-500/15" : "bg-red-500/15"
            )}>
              {data?.connected
                ? <Wifi className="h-7 w-7 text-emerald-400" />
                : <WifiOff className="h-7 w-7 text-red-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-ra-text">{data?.provider ?? "POS System"}</p>
                <span className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  data?.connected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                )}>
                  {data?.connected ? "Connected" : "Offline"}
                </span>
              </div>
              <p className="text-sm text-ra-muted mt-0.5">
                Last sync:{" "}
                {data?.lastSync
                  ? new Date(data.lastSync).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                  : "Never"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing || !data?.connected}
            className="flex items-center gap-2 rounded-xl bg-ra-accent px-4 py-2.5 text-sm font-semibold text-ra-bg hover:bg-ra-accent/90 disabled:opacity-40 transition-colors"
          >
            {syncing
              ? <><Loader2 className="h-4 w-4 animate-spin" />Syncing…</>
              : <><RefreshCw className="h-4 w-4" />Sync Now</>}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { label: "Synced Today",  value: data?.syncedToday   ?? 0, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Pending Sync",  value: data?.unsyncedCount ?? 0, icon: Clock,        color: "text-amber-400"  },
            { label: "Total Today",   value: (data?.syncedToday ?? 0) + (data?.unsyncedCount ?? 0), icon: RefreshCw, color: "text-ra-muted" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-ra-border bg-ra-bg p-4 space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon className={cn("h-3.5 w-3.5", color)} />
                <p className="text-xs text-ra-muted">{label}</p>
              </div>
              <p className="font-display text-2xl font-bold text-ra-text">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order flow */}
      <div className="rounded-2xl border border-ra-border bg-ra-surface p-5 space-y-4">
        <h2 className="font-display text-base font-semibold text-ra-text">Order Flow Pipeline</h2>
        <div className="flex flex-wrap items-center gap-2">
          {FLOW_STAGES.map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1.5 rounded-xl border border-ra-border bg-ra-bg px-4 py-3 w-24 text-center">
                <span className="text-2xl">{stage.icon}</span>
                <p className="text-[11px] font-semibold text-ra-text leading-tight">{stage.label}</p>
                <p className="text-[10px] text-ra-muted leading-tight">{stage.desc}</p>
              </div>
              {i < FLOW_STAGES.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-ra-muted/40" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-ra-border bg-ra-surface p-5 space-y-4">
        <h2 className="font-display text-base font-semibold text-ra-text">Recent Orders</h2>
        {!data?.recentOrders?.length ? (
          <p className="text-sm text-ra-muted">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 rounded-xl border border-ra-border bg-ra-bg px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ra-accent/15 text-xs font-bold text-ra-accent">
                  {order.table.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ra-text">#{order.orderNumber}</p>
                  <p className="text-xs text-ra-muted">
                    {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase shrink-0",
                  statusBadge(order.status)
                )}>
                  {order.status}
                </span>
                <span className="shrink-0 text-sm font-semibold text-ra-text">{formatCurrency(order.total)}</span>
                <div className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  order.posSynced ? "bg-emerald-500/15" : "bg-amber-500/15"
                )}>
                  {order.posSynced
                    ? <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    : <Clock className="h-3 w-3 text-amber-400" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demo note */}
      <div className="rounded-xl border border-ra-border bg-ra-surface/50 px-4 py-3">
        <p className="text-sm text-ra-muted">
          <span className="font-medium text-ra-text">Demo Mode:</span>
          {" "}POS integration is simulated. In production, connect Square, Toast, or Lightspeed via API credentials in platform settings.
        </p>
      </div>
    </div>
  );
}
