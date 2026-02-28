"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, MessageSquare,
  Globe, Table2, Bot, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Modal, ModalHeader, ModalTitle, ModalDescription,
  ModalBody, ModalFooter,
} from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import {
  WAITER_PERSONALITIES, WAITER_TONES, WAITER_LANGUAGES, WAITER_AVATARS,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TableSummary {
  id:     string;
  number: number;
  status: string;
}

interface Waiter {
  id:             string;
  name:           string;
  avatar:         string;
  personality:    string;
  tone:           string;
  languages:      string[];
  greeting:       string | null;
  isActive:       boolean;
  tables:         TableSummary[];
  _count:         { chatSessions: number };
  createdAt:      string;
}

export interface WaitersPageClientProps {
  waiters:       Waiter[];
  allTables:     TableSummary[];
  todayChats:    Record<string, number>; // waiterId → today's chat count
  todayOrders:   Record<string, number>; // waiterId → today's orders taken
}

// ---------------------------------------------------------------------------
// Waiter Form Modal (create + edit)
// ---------------------------------------------------------------------------

interface WaiterFormState {
  name:        string;
  avatar:      string;
  personality: string;
  tone:        string;
  languages:   string[];
  greeting:    string;
  tableIds:    string[];
}

function defaultForm(waiter?: Waiter): WaiterFormState {
  return {
    name:        waiter?.name        ?? "",
    avatar:      waiter?.avatar      ?? WAITER_AVATARS[0],
    personality: waiter?.personality ?? WAITER_PERSONALITIES[0].value,
    tone:        waiter?.tone        ?? "friendly",
    languages:   waiter?.languages   ?? ["English"],
    greeting:    waiter?.greeting    ?? "",
    tableIds:    waiter?.tables.map((t) => t.id) ?? [],
  };
}

function WaiterFormModal({
  waiter,
  allTables,
  onClose,
}: {
  waiter?:   Waiter;
  allTables: TableSummary[];
  onClose:   () => void;
}) {
  const router  = useRouter();
  const isEdit  = Boolean(waiter);

  const [form,    setForm]    = useState<WaiterFormState>(() => defaultForm(waiter));
  const [error,   setError]   = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState<"profile" | "tables">("profile");

  function set<K extends keyof WaiterFormState>(key: K, val: WaiterFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function toggleLanguage(lang: string) {
    set(
      "languages",
      form.languages.includes(lang)
        ? form.languages.filter((l) => l !== lang)
        : [...form.languages, lang]
    );
  }

  function toggleTable(id: string) {
    set(
      "tableIds",
      form.tableIds.includes(id)
        ? form.tableIds.filter((t) => t !== id)
        : [...form.tableIds, id]
    );
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (form.languages.length === 0) { setError("Select at least one language."); return; }

    setSaving(true);
    setError(null);
    try {
      const url    = isEdit ? `/api/waiters/${waiter!.id}` : "/api/waiters";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          greeting: form.greeting.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to save waiter.");
      }
      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSaving(false);
    }
  }

  const selectedPersonality = WAITER_PERSONALITIES.find((p) => p.value === form.personality);

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={isEdit ? `Edit: ${waiter!.name}` : "Add New AI Waiter"}
      description="Configure personality, languages, and table assignments."
      contentClassName="bg-ra-surface border-ra-border text-ra-text"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-red-400 min-h-[1rem]">{error ?? ""}</div>
          <div className="flex gap-3">
            <Button variant="ghost"  size="sm" onClick={onClose}   disabled={saving}>Cancel</Button>
            <Button variant="amber"  size="sm" loading={saving} onClick={handleSave}>
              {isEdit ? "Save Changes" : "Create Waiter"}
            </Button>
          </div>
        </div>
      }
    >
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-ra-bg rounded-xl p-1">
        {(["profile", "tables"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-all",
              tab === t
                ? "bg-ra-surface text-ra-text shadow-sm"
                : "text-ra-muted hover:text-ra-text"
            )}
          >
            {t === "profile" ? "Profile & Personality" : `Tables (${form.tableIds.length})`}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="space-y-6">
          {/* Avatar + Name row */}
          <div className="flex items-start gap-4">
            {/* Avatar picker */}
            <div className="shrink-0">
              <div className="text-5xl w-16 h-16 flex items-center justify-center rounded-2xl bg-ra-bg border border-ra-border mb-2">
                {form.avatar}
              </div>
              <div className="grid grid-cols-4 gap-1 w-32">
                {WAITER_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => set("avatar", emoji)}
                    className={cn(
                      "w-7 h-7 text-base rounded-md hover:bg-white/10 transition-colors flex items-center justify-center",
                      form.avatar === emoji && "bg-ra-accent/20 ring-1 ring-ra-accent/60"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-ra-text mb-1">
                Waiter Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Arjun"
                className="w-full rounded-lg border border-ra-border bg-ra-bg px-3 py-2 text-sm text-ra-text placeholder:text-ra-muted/50 focus:border-ra-accent/50 focus:outline-none focus:ring-1 focus:ring-ra-accent/30"
              />
              <p className="mt-1.5 text-xs text-ra-muted">
                Customers will see this name in the chat.
              </p>
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-medium text-ra-text mb-2">Personality *</label>
            <div className="grid grid-cols-2 gap-2">
              {WAITER_PERSONALITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set("personality", p.value)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all",
                    form.personality === p.value
                      ? "border-ra-accent/60 bg-ra-accent/10 text-ra-text"
                      : "border-ra-border bg-ra-bg text-ra-muted hover:border-ra-border/80 hover:text-ra-text"
                  )}
                >
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-[11px] mt-0.5 opacity-70">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-ra-text mb-2">Tone</label>
            <div className="flex gap-2">
              {WAITER_TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("tone", t.value)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-sm font-medium transition-all",
                    form.tone === t.value
                      ? "border-ra-accent/60 bg-ra-accent/10 text-ra-text"
                      : "border-ra-border bg-ra-bg text-ra-muted hover:text-ra-text"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-ra-text mb-2">
              Languages *
              <span className="ml-2 text-xs font-normal text-ra-muted">
                ({form.languages.length} selected)
              </span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {WAITER_LANGUAGES.map((lang) => {
                const active = form.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
                      active
                        ? "border-ra-accent/60 bg-ra-accent/10 text-ra-text"
                        : "border-ra-border bg-ra-bg text-ra-muted hover:text-ra-text"
                    )}
                  >
                    {active && <CheckCircle2 size={10} className="text-ra-accent shrink-0" />}
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom greeting */}
          <div>
            <label className="block text-sm font-medium text-ra-text mb-1">
              Custom Greeting
              <span className="ml-2 text-xs font-normal text-ra-muted">(optional)</span>
            </label>
            <textarea
              value={form.greeting}
              onChange={(e) => set("greeting", e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={`e.g. "Namaste! Welcome to Saffron Palace! I'm ${form.name || "your waiter"}, how can I help you today?"`}
              className="w-full rounded-lg border border-ra-border bg-ra-bg px-3 py-2 text-sm text-ra-text placeholder:text-ra-muted/40 focus:border-ra-accent/50 focus:outline-none focus:ring-1 focus:ring-ra-accent/30 resize-none"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-ra-muted">
                Sent automatically when a customer opens the chat.
              </p>
              <span className="text-xs text-ra-muted/50">{form.greeting.length}/500</span>
            </div>
          </div>
        </div>
      )}

      {tab === "tables" && (
        <div className="space-y-4">
          <p className="text-sm text-ra-muted">
            Select which tables this waiter will serve. Each table can only have one assigned waiter.
          </p>

          {allTables.length === 0 ? (
            <div className="text-center py-8 text-ra-muted text-sm">
              No tables found. Add tables from the Floor Plan page first.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {allTables.map((table) => {
                const isAssigned  = form.tableIds.includes(table.id);
                const statusColor: Record<string, string> = {
                  empty:    "text-gray-400",
                  occupied: "text-blue-400",
                  ordering: "text-amber-400",
                  billing:  "text-green-400",
                };

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => toggleTable(table.id)}
                    className={cn(
                      "relative rounded-xl border p-3 text-center transition-all",
                      isAssigned
                        ? "border-ra-accent/60 bg-ra-accent/10"
                        : "border-ra-border bg-ra-bg hover:border-ra-border/80"
                    )}
                  >
                    {isAssigned && (
                      <CheckCircle2
                        size={12}
                        className="absolute right-1.5 top-1.5 text-ra-accent"
                      />
                    )}
                    <div className={cn(
                      "text-lg font-display font-bold",
                      isAssigned ? "text-ra-text" : "text-ra-muted"
                    )}>
                      {table.number}
                    </div>
                    <div className={cn("text-[10px] capitalize mt-0.5", statusColor[table.status] ?? "text-gray-400")}>
                      {table.status}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {form.tableIds.length > 0 && (
            <div className="rounded-xl bg-ra-bg border border-ra-border px-4 py-3 text-sm text-ra-muted">
              <span className="text-ra-text font-medium">{form.tableIds.length} table{form.tableIds.length > 1 ? "s" : ""}</span>
              {" "}assigned to {form.name || "this waiter"}.
            </div>
          )}
        </div>
      )}

      {/* Preview strip at bottom of profile tab */}
      {tab === "profile" && selectedPersonality && (
        <div className="mt-6 rounded-xl border border-ra-border bg-ra-bg p-3 flex items-center gap-3">
          <div className="text-2xl">{form.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ra-text truncate">{form.name || "New Waiter"}</span>
              <span className="text-[10px] rounded-full bg-ra-accent/10 px-2 py-0.5 text-ra-accent capitalize">{form.tone}</span>
            </div>
            <p className="text-xs text-ra-muted truncate">{selectedPersonality.description}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            {form.languages.slice(0, 3).map((l) => (
              <span key={l} className="text-[10px] rounded bg-white/5 px-1.5 py-0.5 text-ra-muted">{l.slice(0, 3)}</span>
            ))}
            {form.languages.length > 3 && (
              <span className="text-[10px] rounded bg-white/5 px-1.5 py-0.5 text-ra-muted">+{form.languages.length - 3}</span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

function DeleteWaiterModal({
  waiter,
  onClose,
}: {
  waiter:  Waiter;
  onClose: () => void;
}) {
  const router  = useRouter();
  const [error,    setError]    = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [result,   setResult]   = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/waiters/${waiter.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({})) as { deleted?: boolean; message?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Failed to delete waiter.");
      if (body.deleted === false && body.message) {
        setResult(body.message);
      } else {
        onClose();
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Remove ${waiter.name}?`}
      description={
        waiter._count.chatSessions > 0
          ? `${waiter.name} has ${waiter._count.chatSessions} conversation${waiter._count.chatSessions > 1 ? "s" : ""} — they will be deactivated (not deleted) to preserve history.`
          : `${waiter.name} will be permanently removed.`
      }
      contentClassName="bg-ra-surface border-ra-border text-ra-text"
      size="sm"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-red-400 min-h-[1rem]">{error ?? ""}</div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={deleting}>Cancel</Button>
            {!result && (
              <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
                {waiter._count.chatSessions > 0 ? "Deactivate" : "Delete"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {result ? (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-400">
          {result}
        </div>
      ) : (
        <p className="text-sm text-ra-muted">
          Tables currently assigned to <span className="text-ra-text font-medium">{waiter.name}</span> will be unassigned automatically.
        </p>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Waiter Card
// ---------------------------------------------------------------------------

function WaiterCard({
  waiter,
  todayChats,
  todayOrders,
  onEdit,
  onDelete,
}: {
  waiter:      Waiter;
  todayChats:  number;
  todayOrders: number;
  onEdit:      (w: Waiter) => void;
  onDelete:    (w: Waiter) => void;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-ra-surface p-6 flex flex-col gap-4 group",
        "transition-all duration-200 hover:border-ra-accent/30 hover:shadow-lg hover:shadow-black/20",
        !waiter.isActive && "opacity-50",
        waiter.isActive ? "border-ra-border" : "border-ra-border/40"
      )}
    >
      {/* Edit / Delete buttons on hover */}
      <div className="absolute right-4 top-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(waiter)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-ra-muted hover:text-ra-text transition-colors"
          title="Edit waiter"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(waiter)}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-ra-muted hover:text-red-400 transition-colors"
          title="Remove waiter"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="text-5xl w-18 h-18 flex items-center justify-center rounded-2xl bg-ra-bg border border-ra-border w-[72px] h-[72px]">
          {waiter.avatar}
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-ra-text leading-tight">
            {waiter.name}
          </h3>
          {!waiter.isActive && (
            <span className="text-[10px] rounded-full bg-red-500/10 text-red-400 px-2 py-0.5">
              Inactive
            </span>
          )}
          <p className="text-xs text-ra-muted mt-0.5 leading-snug line-clamp-2">
            {waiter.personality}
          </p>
        </div>
      </div>

      {/* Languages */}
      <div className="flex flex-wrap justify-center gap-1">
        {waiter.languages.map((lang) => (
          <span
            key={lang}
            className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-ra-muted"
          >
            <Globe size={8} />
            {lang}
          </span>
        ))}
      </div>

      {/* Assigned tables */}
      <div className="rounded-xl bg-ra-bg border border-ra-border/60 px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Table2 size={11} className="text-ra-muted/70" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ra-muted/70">
            Tables
          </span>
        </div>
        {waiter.tables.length === 0 ? (
          <p className="text-xs text-ra-muted/40 italic">No tables assigned</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {waiter.tables.map((t) => {
              const dotColor: Record<string, string> = {
                empty:    "bg-gray-400",
                occupied: "bg-blue-400",
                ordering: "bg-amber-400",
                billing:  "bg-green-400",
              };
              return (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-ra-text"
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor[t.status] ?? "bg-gray-400")} />
                  {t.number}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-ra-bg border border-ra-border/60 px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <MessageSquare size={11} className="text-ra-muted/70" />
          </div>
          <div className="text-lg font-display font-bold text-ra-text leading-none">{todayChats}</div>
          <div className="text-[10px] text-ra-muted/70 mt-0.5">chats today</div>
        </div>
        <div className="rounded-xl bg-ra-bg border border-ra-border/60 px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Bot size={11} className="text-ra-muted/70" />
          </div>
          <div className="text-lg font-display font-bold text-ra-text leading-none">{todayOrders}</div>
          <div className="text-[10px] text-ra-muted/70 mt-0.5">orders taken</div>
        </div>
      </div>

      {/* Tone badge */}
      <div className="flex items-center justify-center">
        <span className="rounded-full bg-ra-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ra-accent capitalize">
          {waiter.tone} tone
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export function WaitersPageClient({
  waiters,
  allTables,
  todayChats,
  todayOrders,
}: WaitersPageClientProps) {
  const [editTarget,   setEditTarget]   = useState<Waiter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Waiter | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Active waiters first, then inactive
  const sorted = [...waiters].sort((a, b) => {
    if (a.isActive === b.isActive) return 0;
    return a.isActive ? -1 : 1;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ra-text">AI Waiters</h1>
          <p className="text-sm text-ra-muted mt-0.5">
            {waiters.filter((w) => w.isActive).length} active ·{" "}
            {waiters.reduce((s, w) => s + w.tables.length, 0)} tables covered
          </p>
        </div>
        <Button
          variant="amber"
          size="sm"
          leftIcon={<Plus size={15} />}
          onClick={() => setShowAddModal(true)}
        >
          Add Waiter
        </Button>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <p className="text-ra-text font-medium">No AI waiters yet</p>
          <p className="text-sm text-ra-muted mt-1 mb-6">
            Create your first AI waiter to start serving customers.
          </p>
          <Button variant="amber" size="sm" leftIcon={<Plus size={15} />} onClick={() => setShowAddModal(true)}>
            Add First Waiter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sorted.map((waiter) => (
            <WaiterCard
              key={waiter.id}
              waiter={waiter}
              todayChats={todayChats[waiter.id]  ?? 0}
              todayOrders={todayOrders[waiter.id] ?? 0}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}

          {/* Add new card */}
          <button
            onClick={() => setShowAddModal(true)}
            className={cn(
              "rounded-2xl border-2 border-dashed border-ra-border/40 p-6",
              "flex flex-col items-center justify-center gap-3 min-h-[320px]",
              "text-ra-muted/50 hover:text-ra-muted hover:border-ra-accent/40",
              "hover:bg-white/2 transition-all duration-200 cursor-pointer"
            )}
          >
            <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-current flex items-center justify-center">
              <Plus size={22} className="opacity-60" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">New AI Waiter</p>
              <p className="text-xs opacity-60 mt-0.5">Add another personality</p>
            </div>
          </button>
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <WaiterFormModal
          allTables={allTables}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <WaiterFormModal
          waiter={editTarget}
          allTables={allTables}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteWaiterModal
          waiter={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
