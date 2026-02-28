import { cn } from "@/lib/utils";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<SpinnerSize, string> = {
  xs: "h-3 w-3 border",
  sm: "h-4 w-4 border",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
  xl: "h-12 w-12 border-[3px]",
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

function Spinner({ size = "md", className, label = "Loading…" }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center gap-2">
      <span
        className={cn(
          "rounded-full border-current border-r-transparent animate-spin",
          sizeClasses[size],
          className
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/* ── Full-page loading screen ────────────────────────────────────────────── */
function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4">
      <Spinner size="xl" />
      <p className="text-sm opacity-50 font-sans">{label}</p>
    </div>
  );
}

/* ── Inline section loader ───────────────────────────────────────────────── */
function SectionLoader({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}>
      <Spinner size="lg" />
      <p className="text-sm opacity-50 font-sans">{label}</p>
    </div>
  );
}

export { Spinner, PageLoader, SectionLoader };
