export default function SuperAdminLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-sa-border/50" />
        <div className="h-4 w-72 rounded-lg bg-sa-border/30" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-sa-border bg-sa-surface p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-20 rounded bg-sa-border/50" />
              <div className="h-9 w-9 rounded-xl bg-sa-border/30" />
            </div>
            <div className="h-8 w-24 rounded-lg bg-sa-border/50" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-sa-border bg-sa-surface p-5 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-sa-border bg-sa-bg px-4 py-3">
            <div className="h-4 w-40 rounded bg-sa-border/50" />
            <div className="h-4 w-16 rounded-full bg-sa-border/30" />
            <div className="flex-1" />
            <div className="h-4 w-20 rounded bg-sa-border/30" />
            <div className="h-4 w-16 rounded bg-sa-border/30" />
          </div>
        ))}
      </div>
    </div>
  );
}
