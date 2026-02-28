import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/* ── Card root ─────────────────────────────────────────────────────────── */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a subtle hover effect */
  hoverable?: boolean;
  /** Removes padding from the card body */
  flush?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable, flush, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border",
        !flush && "p-0",
        hoverable && "transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

/* ── CardHeader ────────────────────────────────────────────────────────── */
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1 px-5 pt-5 pb-4", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

/* ── CardTitle ─────────────────────────────────────────────────────────── */
const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display text-lg font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

/* ── CardDescription ───────────────────────────────────────────────────── */
const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm opacity-60 leading-relaxed", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

/* ── CardContent ───────────────────────────────────────────────────────── */
const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-5 pb-5", className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

/* ── CardFooter ─────────────────────────────────────────────────────────── */
const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-3 px-5 py-4 border-t border-inherit", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
