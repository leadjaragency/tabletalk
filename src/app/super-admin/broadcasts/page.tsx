import { Radio } from "lucide-react";

export default function BroadcastsPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "rgba(198,163,78,0.15)" }}
        >
          <Radio className="h-5 w-5" style={{ color: "#C6A34E" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Broadcasts</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Send platform-wide announcements to all restaurant dashboards
          </p>
        </div>
      </div>

      <div
        className="mt-10 flex flex-col items-center justify-center rounded-2xl py-20 text-center"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.12)" }}
      >
        <Radio className="h-10 w-10 mb-4" style={{ color: "rgba(255,255,255,0.2)" }} />
        <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
          Coming soon
        </p>
        <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          Maintenance windows, new features, and tier change notices — all from one place.
        </p>
      </div>
    </div>
  );
}
