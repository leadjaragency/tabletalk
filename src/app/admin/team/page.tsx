"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Trash2, Loader2, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  id:        string;
  name:      string;
  email:     string;
  role:      string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  restaurant_owner:   "Owner",
  restaurant_manager: "Manager",
};

function roleBadge(role: string) {
  return role === "restaurant_owner"
    ? "border-ra-accent/40 bg-ra-accent/10 text-ra-accent"
    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
}

// ---------------------------------------------------------------------------
// Invite modal
// ---------------------------------------------------------------------------
function InviteModal({
  onClose,
  onInvited,
}: {
  onClose:   () => void;
  onInvited: (m: Member) => void;
}) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function submit() {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res  = await fetch("/api/restaurant/team", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, role: "restaurant_manager", password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to invite");
      onInvited(data.member);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-ra-border bg-ra-surface p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ra-text">Invite Team Member</h2>
          <button onClick={onClose} className="text-ra-muted hover:text-ra-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Temporary Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 pr-10 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ra-muted hover:text-ra-text"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-ra-border bg-ra-bg/50 px-3 py-2.5">
            <p className="text-xs text-ra-muted">
              Role: <span className="font-medium text-emerald-400">Manager</span>
              {" "}— can manage orders, tables, and menu. Cannot manage team or billing.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-ra-border py-2.5 text-sm text-ra-muted hover:text-ra-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !name.trim() || !email.trim() || !password.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-ra-accent py-2.5 text-sm font-semibold text-ra-bg disabled:opacity-40 transition-opacity"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Inviting…</> : "Invite Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TeamPage() {
  const [members,    setMembers]    = useState<Member[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [userRole,   setUserRole]   = useState<string>("");
  const [showInvite, setShowInvite] = useState(false);
  const [removing,   setRemoving]   = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/restaurant/team");
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members ?? []);
        setUserRole(data.currentRole ?? "");
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRemove(memberId: string) {
    if (!confirm("Remove this team member? They will lose access immediately.")) return;
    setRemoving(memberId);
    setError(null);
    try {
      const res  = await fetch(`/api/restaurant/team/${memberId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to remove");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally { setRemoving(null); }
  }

  const isOwner = userRole === "restaurant_owner";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ra-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ra-text">Team</h1>
          <p className="mt-1 text-sm text-ra-muted">
            Manage restaurant users and their access levels
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 rounded-xl bg-ra-accent px-4 py-2.5 text-sm font-semibold text-ra-bg hover:bg-ra-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Invite Member
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!isOwner && (
        <div className="rounded-xl border border-ra-border bg-ra-surface/50 px-4 py-3 text-sm text-ra-muted">
          Only restaurant owners can invite or remove team members.
        </div>
      )}

      {/* Members */}
      <div className="space-y-3">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-ra-border py-20 text-center">
            <Users className="h-10 w-10 text-ra-muted/40" />
            <div>
              <p className="font-medium text-ra-text">No team members yet</p>
              <p className="mt-1 text-sm text-ra-muted">Invite a manager to help run your restaurant.</p>
            </div>
          </div>
        ) : (
          members.map((member) => {
            const isOwnerRow = member.role === "restaurant_owner";
            return (
              <div
                key={member.id}
                className="flex items-center gap-4 rounded-2xl border border-ra-border bg-ra-surface px-5 py-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ra-accent/15 text-sm font-bold text-ra-accent">
                  {member.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ra-text">{member.name}</p>
                    <span className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      roleBadge(member.role)
                    )}>
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </div>
                  <p className="text-xs text-ra-muted mt-0.5">{member.email}</p>
                </div>

                {isOwner && !isOwnerRow && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    disabled={removing === member.id}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                    title="Remove member"
                  >
                    {removing === member.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={(m) => {
            setMembers((prev) => [...prev, m]);
            setShowInvite(false);
          }}
        />
      )}
    </div>
  );
}
