"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

export function RevenueExportButton() {
  const today = new Date().toISOString().slice(0, 10);
  const ago30 = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

  const [open,      setOpen]      = useState(false);
  const [from,      setFrom]      = useState(ago30);
  const [to,        setTo]        = useState(today);
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    setExporting(true);
    const a  = document.createElement("a");
    a.href   = `/api/analytics/revenue-export?from=${from}&to=${to}`;
    a.click();
    setTimeout(() => setExporting(false), 1500);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
          open
            ? "border-ra-accent/50 bg-ra-accent/10 text-ra-accent"
            : "border-ra-border text-ra-muted hover:text-ra-text hover:border-ra-accent/40"
        )}
      >
        <Download size={13} />
        Export Report
      </button>

      {open && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-ra-accent/30 bg-ra-surface p-4 w-full sm:w-auto">
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-ra-border bg-ra-bg px-3 py-1.5 text-sm text-ra-text focus:outline-none focus:ring-2 focus:ring-ra-accent/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ra-muted mb-1">To</label>
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-ra-border bg-ra-bg px-3 py-1.5 text-sm text-ra-text focus:outline-none focus:ring-2 focus:ring-ra-accent/30"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg bg-ra-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
          >
            <Download size={14} />
            {exporting ? "Downloading…" : "Download CSV"}
          </button>
        </div>
      )}
    </div>
  );
}
