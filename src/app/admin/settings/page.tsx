"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, AlertTriangle } from "lucide-react";

interface RestaurantProfile {
  id:       string;
  name:     string;
  cuisine:  string;
  tagline:  string | null;
  phone:    string | null;
  email:    string | null;
  address:  string | null;
  taxRate:  number;
  hours:    { open: string; close: string } | null;
  currency: string;
}

export default function AdminSettingsPage() {
  const [profile,    setProfile]    = useState<RestaurantProfile | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [name,       setName]       = useState("");
  const [cuisine,    setCuisine]    = useState("");
  const [tagline,    setTagline]    = useState("");
  const [phone,      setPhone]      = useState("");
  const [email,      setEmail]      = useState("");
  const [address,    setAddress]    = useState("");
  const [taxRate,    setTaxRate]    = useState("8");
  const [hoursOpen,  setHoursOpen]  = useState("11:00");
  const [hoursClose, setHoursClose] = useState("23:00");

  const load = useCallback(async () => {
    try {
      const res  = await fetch("/api/restaurant/profile");
      const data = await res.json();
      if (res.ok && data.restaurant) {
        const r = data.restaurant as RestaurantProfile;
        setProfile(r);
        setName(r.name ?? "");
        setCuisine(r.cuisine ?? "");
        setTagline(r.tagline ?? "");
        setPhone(r.phone ?? "");
        setEmail(r.email ?? "");
        setAddress(r.address ?? "");
        setTaxRate(String(Math.round((r.taxRate ?? 0.08) * 100)));
        const h = r.hours as { open?: string; close?: string } | null;
        setHoursOpen(h?.open ?? "11:00");
        setHoursClose(h?.close ?? "23:00");
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const res = await fetch("/api/restaurant/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:    name.trim()    || undefined,
          cuisine: cuisine.trim() || undefined,
          tagline: tagline.trim() || undefined,
          phone:   phone.trim()   || undefined,
          email:   email.trim()   || undefined,
          address: address.trim() || undefined,
          taxRate: parseFloat(taxRate) / 100 || 0.08,
          hours:   { open: hoursOpen, close: hoursClose },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ra-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ra-text">Settings</h1>
        <p className="mt-1 text-sm text-ra-muted">Update your restaurant profile and configuration</p>
      </div>

      {/* Profile */}
      <section className="rounded-2xl border border-ra-border bg-ra-surface p-6 space-y-5">
        <h2 className="font-display text-base font-semibold text-ra-text">Restaurant Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Restaurant Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Cuisine Type</label>
            <input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="e.g. Authentic Indian"
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Tagline</label>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A short description shown to customers"
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567"
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@restaurant.com"
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, State 12345"
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text placeholder:text-ra-muted focus:border-ra-accent/50 focus:outline-none" />
          </div>
        </div>
      </section>

      {/* Hours & Tax */}
      <section className="rounded-2xl border border-ra-border bg-ra-surface p-6 space-y-5">
        <h2 className="font-display text-base font-semibold text-ra-text">Hours & Tax</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Opening Time</label>
            <input type="time" value={hoursOpen} onChange={(e) => setHoursOpen(e.target.value)}
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text focus:border-ra-accent/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Closing Time</label>
            <input type="time" value={hoursClose} onChange={(e) => setHoursClose(e.target.value)}
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text focus:border-ra-accent/50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1.5">Tax Rate (%)</label>
            <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} min="0" max="30" step="0.1"
              className="w-full rounded-xl border border-ra-border bg-ra-bg px-3 py-2.5 text-sm text-ra-text focus:border-ra-accent/50 focus:outline-none" />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          Changes saved successfully.
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-ra-accent px-6 py-3 text-sm font-semibold text-ra-bg hover:bg-ra-accent/90 disabled:opacity-40 transition-colors">
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
            : <><Save className="h-4 w-4" />Save Changes</>}
        </button>
      </div>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h2 className="font-display text-base font-semibold text-red-400">Danger Zone</h2>
        </div>
        <p className="text-sm text-ra-muted">
          Contact platform support to reset data or deactivate your account. These actions cannot be undone.
        </p>
        <button
          onClick={() => alert("Contact support at hello@servemytable.com to reset restaurant data.")}
          className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Reset Restaurant Data
        </button>
      </section>

      {profile && (
        <section className="rounded-2xl border border-ra-border bg-ra-surface p-5 space-y-3">
          <h2 className="font-display text-base font-semibold text-ra-text">Account Info</h2>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ra-muted">Restaurant ID</span>
              <span className="font-mono text-xs text-ra-text/60">{profile.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ra-muted">Currency</span>
              <span className="text-ra-text">{profile.currency}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
