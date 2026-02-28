export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-ra-border/50" />
        <div className="h-4 w-72 rounded-lg bg-ra-border/30" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-ra-border bg-ra-surface p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-20 rounded bg-ra-border/50" />
              <div className="h-9 w-9 rounded-xl bg-ra-border/30" />
            </div>
            <div className="h-8 w-24 rounded-lg bg-ra-border/50" />
            <div className="h-3 w-32 rounded bg-ra-border/30" />
          </div>
        ))}
      </div>

      {/* Content rows skeleton */}
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-ra-border bg-ra-surface p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-ra-border/30 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-ra-border/50" />
              <div className="h-3 w-64 rounded bg-ra-border/30" />
            </div>
            <div className="h-8 w-20 rounded-xl bg-ra-border/30 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
