"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, UtensilsCrossed, Users, LayoutGrid,
  ShoppingBag, AlertTriangle, ExternalLink,
  Trash2, Globe, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RestaurantStatusBadge, TierBadge } from "@/components/ui/StatusBadge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { formatDate, initials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types (match what the server fetches)
// ---------------------------------------------------------------------------

export interface RestaurantDetail {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxRate: number;
  currency: string;
  status: string;
  createdAt: string;
  tier: {
    id: string;
    name: string;
    monthlyPrice: number;
    maxTables: number;
    maxWaiters: number;
  } | null;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>;
  _count: { dishes: number; tables: number; orders: number; reviews: number };
  avgRating: number | null;
}

export interface Tier {
  id: string;
  name: string;
  monthlyPrice: number;
  maxTables: number;
  maxWaiters: number;
}

// ---------------------------------------------------------------------------
// Stat mini-card
// ---------------------------------------------------------------------------

function StatMini({
  icon: Icon,
  label,
  value,
  color = "text-sa-accent",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sa-border bg-sa-surface p-4">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-current/10 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="font-display text-2xl font-bold text-sa-text tabular-nums">{value}</p>
      <p className="text-xs text-sa-muted">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Change Tier Modal
// ---------------------------------------------------------------------------

function ChangeTierModal({
  restaurantId,
  currentTierId,
  tiers,
  onClose,
}: {
  restaurantId: string;
  currentTierId: string | null;
  tiers: Tier[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [tierId, setTierId] = useState(currentTierId ?? tiers[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/super-admin/restaurants/${restaurantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tierId }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError((body as { error?: string }).error ?? "Failed to update tier.");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="Change Subscription Tier"
      contentClassName="bg-sa-surface border-sa-border text-sa-text"
    >
      <div className="space-y-3">
        {tiers.map((t) => (
          <label
            key={t.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
              tierId === t.id
                ? "border-sa-accent bg-sa-accent/10"
                : "border-sa-border hover:bg-white/5"
            }`}
          >
            <input
              type="radio"
              name="tier"
              value={t.id}
              checked={tierId === t.id}
              onChange={() => setTierId(t.id)}
              className="mt-1 accent-indigo-500"
            />
            <div>
              <p className="font-medium text-sa-text">{t.name}</p>
              <p className="text-xs text-sa-muted mt-0.5">
                ${t.monthlyPrice}/mo · {t.maxTables === -1 ? "Unlimited" : t.maxTables} tables ·{" "}
                {t.maxWaiters === -1 ? "Unlimited" : t.maxWaiters} waiter
                {t.maxWaiters !== 1 && t.maxWaiters !== -1 ? "s" : ""}
              </p>
            </div>
          </label>
        ))}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <ModalFooter className="border-t border-sa-border">
        <Button variant="ghost" onClick={onClose} className="text-sa-muted">Cancel</Button>
        <Button variant="primary" loading={loading} onClick={save}>Save tier</Button>
      </ModalFooter>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Permanent Delete Confirmation Modal
// ---------------------------------------------------------------------------

function PurgeModal({
  restaurant,
  onClose,
}: {
  restaurant: RestaurantDetail;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");

  async function purge() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/super-admin/restaurants/${restaurant.id}/purge`, {
      method: "DELETE",
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError((body as { error?: string }).error ?? "Failed to permanently delete restaurant.");
      return;
    }
    onClose();
    router.push("/super-admin/restaurants");
  }

  const canDelete = confirm.trim().toLowerCase() === restaurant.name.toLowerCase();

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="Permanently Delete Restaurant"
      contentClassName="bg-sa-surface border-sa-border text-sa-text"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-red-300">This cannot be undone.</p>
            <p>This will permanently delete:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-red-400/80">
              <li>All menu items, categories, and dishes</li>
              <li>All tables, orders, and order history</li>
              <li>All AI waiters, reviews, and promotions</li>
              <li>All team member accounts</li>
              <li>The owner&apos;s login — they will never be able to sign in again</li>
            </ul>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-sa-text/80 mb-1.5">
            Type <strong className="text-sa-text">{restaurant.name}</strong> to confirm
          </label>
          <input
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={restaurant.name}
            className="w-full rounded-lg border border-sa-border bg-sa-bg px-3 py-2 text-sm text-sa-text placeholder:text-sa-muted/40 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <ModalFooter className="border-t border-sa-border">
        <Button variant="ghost" onClick={onClose} className="text-sa-muted">Cancel</Button>
        <Button
          variant="danger"
          loading={loading}
          disabled={!canDelete}
          onClick={purge}
          leftIcon={<Trash2 className="h-4 w-4" />}
        >
          Permanently delete
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RestaurantDetailView({
  restaurant,
  tiers,
}: {
  restaurant: RestaurantDetail;
  tiers: Tier[];
}) {
  const router = useRouter();
  const [tierModalOpen, setTierModal]     = useState(false);
  const [deleteModalOpen, setDeleteModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  async function toggleStatus() {
    const nextStatus =
      restaurant.status === "active"    ? "suspended" :
      restaurant.status === "suspended" ? "active"    : "active";

    setStatusLoading(true);
    await fetch(`/api/super-admin/restaurants/${restaurant.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setStatusLoading(false);
    router.refresh();
  }

  const isActive    = restaurant.status === "active";
  const isSuspended = restaurant.status === "suspended";

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
      {/* Back */}
      <Link
        href="/super-admin/restaurants"
        className="flex items-center gap-1.5 text-sm text-sa-muted hover:text-sa-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Restaurants
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sa-accent/10 text-xl font-bold text-sa-accent">
            {initials(restaurant.name)}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-sa-text">
                {restaurant.name}
              </h1>
              <RestaurantStatusBadge status={restaurant.status as "pending" | "active" | "suspended" | "disabled"} />
              {restaurant.tier && <TierBadge tier={restaurant.tier.name} />}
            </div>
            <p className="mt-1 text-sm text-sa-muted">{restaurant.cuisine}</p>
            {restaurant.tagline && (
              <p className="mt-0.5 text-sm text-sa-muted italic">{restaurant.tagline}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href={`/table/1?restaurant=${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-sa-border px-3 py-1.5 text-xs font-medium text-sa-muted hover:text-sa-text hover:border-sa-accent/40 transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            Customer View
            <ExternalLink className="h-3 w-3 opacity-50" />
          </a>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTierModal(true)}
          >
            Change Tier
          </Button>
          {(isActive || isSuspended) && (
            <Button
              size="sm"
              variant={isActive ? "danger" : "outline"}
              loading={statusLoading}
              onClick={toggleStatus}
            >
              {isActive ? "Suspend" : "Restore"}
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatMini icon={UtensilsCrossed} label="Menu Items"    value={restaurant._count.dishes}  color="text-sa-accent" />
        <StatMini icon={LayoutGrid}      label="Tables"        value={restaurant._count.tables}  color="text-amber-400" />
        <StatMini icon={ShoppingBag}     label="Total Orders"  value={restaurant._count.orders}  color="text-green-400" />
        <StatMini
          icon={Star}
          label="Avg Rating"
          value={restaurant.avgRating != null ? restaurant.avgRating.toFixed(1) + "★" : "—"}
          color="text-amber-400"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile info */}
        <div className="rounded-2xl border border-sa-border bg-sa-surface p-6 space-y-4">
          <h2 className="font-display text-base font-semibold text-sa-text">Profile</h2>
          <dl className="space-y-3 text-sm">
            {[
              { label: "Slug",     value: restaurant.slug,     mono: true },
              { label: "Cuisine",  value: restaurant.cuisine },
              { label: "Phone",    value: restaurant.phone   || "—" },
              { label: "Email",    value: restaurant.email   || "—" },
              { label: "Address",  value: restaurant.address || "—" },
              { label: "Tax Rate", value: `${(restaurant.taxRate * 100).toFixed(1)}%` },
              { label: "Currency", value: restaurant.currency },
              { label: "Joined",   value: formatDate(restaurant.createdAt) },
              {
                label: "Tier",
                value: restaurant.tier
                  ? `${restaurant.tier.name} — $${restaurant.tier.monthlyPrice}/mo`
                  : "No tier assigned",
              },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-sa-muted shrink-0">{label}</dt>
                <dd className={mono ? "font-mono text-sa-text" : "text-sa-text text-right"}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Team members */}
        <div className="rounded-2xl border border-sa-border bg-sa-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-sa-text">Team</h2>
            <span className="text-xs text-sa-muted">
              {restaurant.users.length} member{restaurant.users.length !== 1 ? "s" : ""}
            </span>
          </div>

          {restaurant.users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users className="h-8 w-8 text-sa-muted/30" />
              <p className="text-sm text-sa-muted">No team members</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {restaurant.users.map((u) => (
                <li key={u.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sa-accent/10 text-xs font-bold text-sa-accent">
                    {initials(u.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-sa-text truncate">{u.name}</p>
                      <span className="shrink-0 rounded-full bg-sa-border px-2 py-0.5 text-[10px] text-sa-muted capitalize">
                        {u.role.replace("restaurant_", "")}
                      </span>
                      {!u.isActive && (
                        <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-sa-muted truncate">{u.email}</p>
                  </div>
                  <p className="shrink-0 text-[11px] text-sa-muted/60">
                    {formatDate(u.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modals */}
      {tierModalOpen && (
        <ChangeTierModal
          restaurantId={restaurant.id}
          currentTierId={restaurant.tier?.id ?? null}
          tiers={tiers}
          onClose={() => setTierModal(false)}
        />
      )}
      {deleteModalOpen && (
        <PurgeModal
          restaurant={restaurant}
          onClose={() => setDeleteModal(false)}
        />
      )}
    </div>
  );
}
