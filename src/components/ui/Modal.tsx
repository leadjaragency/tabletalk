"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Re-export primitives for composable use ───────────────────────────── */
export const ModalRoot      = Dialog.Root;
export const ModalTrigger   = Dialog.Trigger;
export const ModalClose     = Dialog.Close;
export const ModalPortal    = Dialog.Portal;

/* ── Overlay ────────────────────────────────────────────────────────────── */
function ModalOverlay({ className, ...props }: Dialog.DialogOverlayProps) {
  return (
    <Dialog.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]",
        "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in",
        className
      )}
      {...props}
    />
  );
}

/* ── Content ────────────────────────────────────────────────────────────── */
interface ModalContentProps extends Dialog.DialogContentProps {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  hideClose?: boolean;
}

function ModalContent({
  className,
  children,
  size = "md",
  hideClose = false,
  ...props
}: ModalContentProps) {
  const sizeClasses = {
    sm:   "max-w-sm",
    md:   "max-w-lg",
    lg:   "max-w-2xl",
    xl:   "max-w-4xl",
    full: "max-w-[95vw]",
  };

  return (
    <ModalPortal>
      <ModalOverlay />
      <Dialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
          // Shape & depth
          "rounded-2xl border border-slate-200/80",
          "shadow-[0_24px_64px_-12px_rgba(0,0,0,0.22),0_8px_24px_-4px_rgba(0,0,0,0.10)]",
          // Gold accent strip at top
          "before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:rounded-t-2xl before:bg-gradient-to-r before:from-[#C6A34E] before:to-[#D4B86A] before:content-['']",
          "focus:outline-none overflow-hidden",
          "data-[state=open]:animate-bounce-in",
          "max-h-[90vh] overflow-y-auto",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <Dialog.Close
            className={cn(
              "absolute right-4 top-4 z-10 rounded-lg p-1.5",
              "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-slate-300"
            )}
          >
            <X size={16} />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        )}
      </Dialog.Content>
    </ModalPortal>
  );
}

/* ── Header ─────────────────────────────────────────────────────────────── */
function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-6 pt-7 pb-4 border-b border-slate-100",
        className
      )}
      {...props}
    />
  );
}

/* ── Title ──────────────────────────────────────────────────────────────── */
function ModalTitle({ className, ...props }: Dialog.DialogTitleProps) {
  return (
    <Dialog.Title
      className={cn(
        "text-[17px] font-bold text-slate-800 leading-snug pr-8 tracking-tight",
        className
      )}
      {...props}
    />
  );
}

/* ── Description ────────────────────────────────────────────────────────── */
function ModalDescription({ className, ...props }: Dialog.DialogDescriptionProps) {
  return (
    <Dialog.Description
      className={cn("mt-1.5 text-sm text-slate-500 leading-relaxed", className)}
      {...props}
    />
  );
}

/* ── Body ───────────────────────────────────────────────────────────────── */
function ModalBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5 bg-white", className)} {...props} />;
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2.5 px-6 py-4",
        "bg-slate-50 border-t border-slate-100",
        className
      )}
      {...props}
    />
  );
}

/* ── Convenience wrapper ─────────────────────────────────────────────────── */
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalContentProps["size"];
  contentClassName?: string;
}

function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size,
  contentClassName,
}: ModalProps) {
  return (
    <ModalRoot open={open} onOpenChange={onOpenChange}>
      <ModalContent size={size} className={cn("bg-white", contentClassName)}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description && <ModalDescription>{description}</ModalDescription>}
        </ModalHeader>
        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    </ModalRoot>
  );
}

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
};
