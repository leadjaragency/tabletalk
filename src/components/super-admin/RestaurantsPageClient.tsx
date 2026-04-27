"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Plus, ChevronDown, ExternalLink,
  MoreHorizontal, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RestaurantStatusBadge, TierBadge } from "@/components/ui/StatusBadge";
import {
  Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter,
} from "@/components/ui/Modal";
import { cn, formatDate, initials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared types (mirrored from Prisma include shape)
// ---------------------------------------------------------------------------

export interface RestaurantRow {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  status: string;
  createdAt: string;
  tier: { id: string; name: string; monthlyPrice: number } | null;
  _count: { tables: number; orders: number };
}

export interface Tier {
  id: string;
  name: string;
  monthlyPrice: number;
}

interface Props {
  restaurants: RestaurantRow[];
  tiers: Tier[];
}

// ---------------------------------------------------------------------------
// Status filter tabs config
// ---------------------------------------------------------------------------

const STATUS_TABS = [
  { label: "All",       value: "" },
  { label: "Active",    value: "active" },
  { label: "Pending",   value: "pending" },
  { label: "Suspended", value: "suspended" },
  { label: "Disabled",  value: "disabled" },
];

// ---------------------------------------------------------------------------
// Add Restaurant Modal
// ---------------------------------------------------------------------------

function AddRestaurantModal({
  open,
  onClose,
  tiers,
}: {
  open: boolean;
  onClose: () => void;
  tiers: Tier[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", cuisine: "", tierId: tiers[0]?.id ?? "",
    ownerName: "", ownerEmail: "", ownerPassword: "",
    phone: "", address: "",
  });

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/super-admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError((body as { error?: string }).error ?? "Failed to create restaurant");
      return;
    }

    onClose();
    router.refresh();
  }

  const inputCls = "bg-sa-bg border-sa-border text-sa-text focus:border-sa-accent/60 focus:ring-sa-accent/20";

  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Add Restaurant"
      description="Create a new restaurant and owner account."
      contentClassName="bg-sa-surface border-sa-border text-sa-text"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Restaurant name" placeholder="Saffron Palace" required className={inputCls} {...field("name")} />
          <Input label="Cuisine type" placeholder="Indian" required className={inputCls} {...field("cuisine")} />
        </div>

        <div>
          <label className="block text-sm font-medium text-sa-text/80 mb-1.5">
            Subscription tier <span className="text-red-400">*</span>
          </label>
          <select
            value={form.tierId}
            onChange={(e) => setForm((f) => ({ ...f, tierId: e.target.value }))}
            className="w-full rounded-lg border border-sa-border bg-sa-bg px-3 py-2 text-sm text-sa-text focus:outline-none focus:ring-2 focus:ring-sa-accent/30"
            required
          >
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — ${t.monthlyPrice}/mo
              </option>
            ))}
          </select>
        </div>

        <div className="h-px bg-sa-border" />

        <p className="text-xs font-semibold uppercase tracking-widest text-sa-muted">Owner account</p>
        <Input label="Owner name" placeholder="Jane Smith" required className={inputCls} {...field("ownerName")} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Owner email" type="email" placeholder="jane@resto.com" required className={inputCls} {...field("ownerEmail")} />
          <Input label="Password" type="password" placeholder="Min. 8 chars" required className={inputCls} {...field("ownerPassword")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone (optional)" type="tel" placeholder="+1 555 000 0000" className={inputCls} {...field("phone")} />
          <Input label="City / Area (optional)" placeholder="New York, NY" className={inputCls} {...field("address")} />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <ModalFooter className="px-0 pb-0 border-t border-sa-border">
          <Button variant="ghost" type="button" onClick={onClose} className="text-sa-muted">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Create restaurant
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Tier change popover (inline dropdown on each row)
// ---------------------------------------------------------------------------

function TierDropdown({
  restaurantId,
  currentTierId,
  tiers,
}: {
  restaurantId: string;
  currentTierId: string | null;
  tiers: Tier[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(tierId: string) {
    setLoading(true);
    await fetch(`/api/super-admin/restaurants/${restaurantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tierId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      defaultValue={currentTierId ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className={cn(
        "rounded-md border border-sa-border bg-sa-bg px-2 py-1 text-xs text-sa-text",
        "focus:outline-none focus:ring-1 focus:ring-sa-accent/40",
        "disabled:opacity-50"
      )}
    >
      <option value="">No tier</option>
      {tiers.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Status toggle button
// ---------------------------------------------------------------------------

function StatusToggle({
  restaurantId,
  status,
}: {
  restaurantId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const nextStatus =
    status === "active"    ? "suspended" :
    status === "suspended" ? "active"    :
    status === "pending"   ? "active"    :
    "active";                              // disabled → active

  const label =
    status === "active"    ? "Suspend"  :
    status === "suspended" ? "Restore"  :
    status === "pending"   ? "Activate" :
    "Enable";

  const btnVariant =
    status === "active" ? "danger" : "outline";

  async function toggle() {
    setLoading(true);
    await fetch(`/api/super-admin/restaurants/${restaurantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant={btnVariant as "danger" | "outline"}
      size="sm"
      loading={loading}
      onClick={toggle}
      className="text-xs"
    >
      {label}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export function RestaurantsPageClient({ restaurants, tiers }: Props) {
  const [q, setQ]                   = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [addOpen, setAddOpen]        = useState(false);

  // Client-side filtering
  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return restaurants.filter((r) => {
      const matchStatus = !statusFilter || r.status === statusFilter;
      const matchQ =
        !query ||
        r.name.toLowerCase().includes(query) ||
        r.slug.toLowerCase().includes(query) ||
        r.cuisine.toLowerCase().includes(query);
      return matchStatus && matchQ;
    });
  }, [restaurants, q, statusFilter]);

  // Counts per status for tab labels
  const counts = useMemo(() => {
    const m: Record<string, number> = { "": restaurants.length };
    for (const r of restaurants) {
      m[r.status] = (m[r.status] ?? 0) + 1;
    }
    return m;
  }, [restaurants]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* Heading + Add button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-sa-text">Restaurants</h1>
          <p className="mt-1 text-sm text-sa-muted">
            {restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""} on the platform
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setAddOpen(true)}
        >
          Add Restaurant
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Search by name or slug…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-sa-border bg-sa-surface pl-9 pr-3 py-2 text-sm text-sa-text",
              "placeholder:text-sa-muted/60",
              "focus:outline-none focus:ring-2 focus:ring-sa-accent/30 focus:border-sa-accent/50"
            )}
          />
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-sa-border bg-sa-surface p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                statusFilter === tab.value
                  ? "bg-sa-accent text-white shadow-sm"
                  : "text-sa-muted hover:text-sa-text hover:bg-slate-100"
              )}
            >
              {tab.label}
              {counts[tab.value] != null && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    statusFilter === tab.value
                      ? "bg-white/25 text-white"
                      : "bg-sa-border text-sa-muted"
                  )}
                >
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-sa-border bg-sa-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sa-border">
                {["Restaurant", "Slug", "Status", "Tier", "Tables", "Orders Today", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-sa-muted"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-sa-border/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-sm text-sa-muted">
                    {q || statusFilter ? "No restaurants match your filters." : "No restaurants yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    {/* Name + cuisine */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sa-accent/10 text-[11px] font-bold text-sa-accent">
                          {initials(r.name)}
                        </div>
                        <div>
                          <p className="font-medium text-sa-text">{r.name}</p>
                          <p className="text-xs text-sa-muted">{r.cuisine}</p>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3">
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-sa-muted font-mono">
                        {r.slug}
                      </code>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <RestaurantStatusBadge status={r.status as "pending" | "active" | "suspended" | "disabled"} />
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3">
                      <TierDropdown
                        restaurantId={r.id}
                        currentTierId={r.tier?.id ?? null}
                        tiers={tiers}
                      />
                    </td>

                    {/* Tables */}
                    <td className="px-4 py-3">
                      <span className="text-sa-text tabular-nums">{r._count.tables}</span>
                    </td>

                    {/* Orders today */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        "tabular-nums font-medium",
                        r._count.orders > 0 ? "text-emerald-600 font-semibold" : "text-sa-muted"
                      )}>
                        {r._count.orders}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/super-admin/restaurants/${r.id}`}
                          className="flex items-center gap-1 rounded-md border border-sa-border px-2.5 py-1 text-xs font-medium text-sa-muted hover:text-sa-text hover:border-sa-accent/40 transition-colors"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                        <StatusToggle restaurantId={r.id} status={r.status} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="border-t border-sa-border px-4 py-3">
            <p className="text-xs text-sa-muted">
              Showing {filtered.length} of {restaurants.length} restaurants
            </p>
          </div>
        )}
      </div>

      {/* Add Restaurant Modal */}
      <AddRestaurantModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        tiers={tiers}
      />
    </div>
  );
}
