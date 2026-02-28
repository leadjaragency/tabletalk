import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-none shrink-0 transition-colors",
  {
    variants: {
      variant: {
        default:  "bg-white/10  text-current",
        success:  "bg-green-500/15  text-green-400",
        warning:  "bg-amber-500/15  text-amber-400",
        danger:   "bg-red-500/15    text-red-400",
        info:     "bg-blue-500/15   text-blue-400",
        purple:   "bg-violet-500/15 text-violet-400",
        // Light-background variants (for customer zone)
        "success-solid": "bg-green-100  text-green-800",
        "warning-solid": "bg-amber-100  text-amber-800",
        "danger-solid":  "bg-red-100    text-red-800",
        "info-solid":    "bg-blue-100   text-blue-800",
        "default-solid": "bg-gray-100   text-gray-700",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            variant === "success" || variant === "success-solid" ? "bg-green-400" :
            variant === "warning" || variant === "warning-solid" ? "bg-amber-400" :
            variant === "danger"  || variant === "danger-solid"  ? "bg-red-400"   :
            variant === "info"    || variant === "info-solid"    ? "bg-blue-400"  :
            variant === "purple"                                  ? "bg-violet-400" :
            "bg-current opacity-60"
          )}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
