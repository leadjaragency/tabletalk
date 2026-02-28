"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, X, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

interface Promotion {
  id:          string;
  title:       string;
  description: string;
  type:        "percentage" | "fixed" | "freeItem";
  value:       number;
  minOrder:    number | null;
  validFrom:   string;
  validUntil:  string;
  isActive:    boolean;
  createdAt:   string;
}

function typeLabel(t: string) {
  if (t === "percentage") return "% Off";
  if (t === "fixed")      return "$ Off";
  return "Free Item";
}

function typeBadge(t: string) {
  if (t === "percentage") return "border-ra-accent/40 bg-ra-accent/10 text-ra-accent";
  if (t === "fixed")      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  return "border-purple-500/30 bg-purple-500/10 text-purple-400";
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Form modal (create + edit)
// ---------------------------------------------------------------------------
const EMPTY: Partial<Promotion> = {
  title: "", description: "", type: "percentage", value: 10,
  minOrder: null, isActive: true,
};

function PromoModal({
  initial,
  onClose,
  onSaved,
}: {
  initial:  Partial<Promotion>;
  onClose:  () => void;
  onSaved:  (p: Promotion) => void;
}) {
  const isEdit = !!initial.id;
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000);

  function toInputDate(d?: string) {
    if (!d) return "";
    return new Date(d).toISOString().slice(0, 10);
  }

  const [title,       setTitle]       = useState(initial.title       ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [type,        setType]        = useState<"percentage" | "fixed" | "freeItem">(
    (initial.type as "percentage" | "fixed" | "freeItem") ?? "percentage"
  );
  const [value,       setValue]       = useState(String(initial.value ?? 10));
  const [minOrder,    setMinOrder]    = useState(initial.minOrder != null ? String(initial.minOrder) : "");
  const [validFrom,   setValidFrom]   = useState(toInputDate(initial.validFrom)   || now.toISOString().slice(0, 10));
  const [validUntil,  setValidUntil]  = useState(toInputDate(initial.validUntil)  || tomorrow.toISOString().slice(0, 10));
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        title, description, type,
        value:      parseFloat(value) || 0,
        minOrder:   minOrder ? parseFloat(minOrder) : null,
        validFrom:  new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil + "T23:59:59").toISOString(),
        isActive:   initial.isActive ?? true,
      };
      const url    = isEdit ? `/api/promotions/${initial.id}` : "/api/promotions";
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      onSaved(data.promotion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="my-auto w-full max-w-lg rounded-2xl border border-ra-border bg-ra-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ra-text">
            {isEdit ? "Edit Promotion" : "New Promotion"}
          </h2>
          <button onClick={onClose} className="text-ra-muted hover:text-ra-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Promo Title / Code</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. WELCOME10"
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Get 10% off your first order"
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ra-muted mb-1.5">Discount Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "percentage" | "fixed" | "freeItem")}
                className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text focus:border-ra-accent/50 focus:outline-none"
              >
                <option value="percentage">Percentage Off</option>
                <option value="fixed">Fixed Amount Off</option>
                <option value="freeItem">Free Item</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ra-muted mb-1.5">
                {type === "percentage" ? "Percent (%)" : type === "fixed" ? "Amount ($)" : "Value"}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min="0"
                className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text focus:border-ra-accent/50 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Min Order Amount ($) — optional</label>
            <input
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="Leave blank for no minimum"
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ra-muted mb-1.5">Valid From</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text focus:border-ra-accent/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ra-muted mb-1.5">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text focus:border-ra-accent/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-ra-border py-2.5 text-sm text-ra-muted hover:text-ra-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !title.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ra-accent py-2.5 text-sm font-semibold text-ra-bg disabled:opacity-40 transition-opacity"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : isEdit ? "Save Changes" : "Create Promo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PromotionsPage() {
  const [promos,   setPromos]   = useState<Promotion[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<Partial<Promotion> | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/promotions");
      const data = await res.json();
      if (res.ok) setPromos(data.promotions ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(p: Promotion) {
    setToggling(p.id);
    try {
      const res  = await fetch(`/api/promotions/${p.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isActive: !p.isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromos((prev) => prev.map((x) => x.id === p.id ? data.promotion : x));
      }
    } catch { /* ignore */ }
    finally { setToggling(null); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promotion permanently?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/promotions/${id}`, { method: "DELETE" });
      setPromos((prev) => prev.filter((x) => x.id !== id));
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  }

  function handleSaved(p: Promotion) {
    setPromos((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = p;
        return next;
      }
      return [p, ...prev];
    });
    setModal(null);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ra-text">Promotions</h1>
          <p className="mt-1 text-sm text-ra-muted">Manage discount codes and special offers</p>
        </div>
        <button
          onClick={() => setModal(EMPTY)}
          className="flex items-center gap-2 rounded-xl bg-ra-accent px-4 py-2.5 text-sm font-semibold text-ra-bg hover:bg-ra-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Promo
        </button>
      </div>

      {/* Game Prize Info */}
      <div className="rounded-xl border border-ra-accent/20 bg-ra-accent/5 px-4 py-3">
        <p className="text-sm text-ra-muted">
          <span className="font-medium text-ra-accent">🎰 Game Prizes:</span>
          {" "}Players can win 5%, 10%, or 15% off — automatically applied at checkout via spin wheel and trivia.
        </p>
      </div>

      {promos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-ra-border py-20 text-center">
          <Tag className="h-10 w-10 text-ra-muted/40" />
          <div>
            <p className="font-medium text-ra-text">No promotions yet</p>
            <p className="mt-1 text-sm text-ra-muted">Create your first promo code to attract customers.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {promos.map((p) => {
            const now   = new Date();
            const from  = new Date(p.validFrom);
            const until = new Date(p.validUntil);
            const isExpired = until < now;
            const isPending = from > now;

            return (
              <div
                key={p.id}
                className={cn(
                  "rounded-2xl border bg-ra-surface p-5 space-y-4 transition-opacity",
                  !p.isActive || isExpired ? "opacity-60" : "border-ra-border"
                )}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-ra-text truncate">{p.title}</h3>
                      <span className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide shrink-0",
                        typeBadge(p.type)
                      )}>
                        {typeLabel(p.type)}
                      </span>
                      {isExpired && (
                        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400 shrink-0">
                          Expired
                        </span>
                      )}
                      {isPending && (
                        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400 shrink-0">
                          Upcoming
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="text-xs text-ra-muted truncate">{p.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-2xl font-bold text-ra-accent">
                      {p.type === "percentage" ? `${p.value}%` : p.type === "fixed" ? `$${p.value}` : "Free"}
                    </p>
                  </div>
                </div>

                {/* Date range */}
                <div className="flex items-center gap-1.5 text-xs text-ra-muted">
                  <CalendarRange className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatDate(p.validFrom)} — {formatDate(p.validUntil)}</span>
                </div>

                {p.minOrder && (
                  <p className="text-xs text-ra-muted">Min order: ${p.minOrder}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-ra-border/50">
                  <button
                    onClick={() => handleToggle(p)}
                    disabled={toggling === p.id}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium transition-colors",
                      p.isActive ? "text-emerald-400 hover:text-emerald-300" : "text-ra-muted hover:text-ra-text"
                    )}
                  >
                    {toggling === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : p.isActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                    {p.isActive ? "Active" : "Inactive"}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModal(p)}
                      className="rounded-lg border border-ra-border px-3 py-1.5 text-xs text-ra-muted hover:text-ra-text transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                    >
                      {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <PromoModal
          initial={modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
