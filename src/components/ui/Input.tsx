"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** Wraps the input+icons in a relative container */
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      wrapperClassName,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      id: idProp,
      type = "text",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium leading-none opacity-80"
          >
            {label}
            {props.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex items-center text-current opacity-40 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            type={type}
            className={cn(
              "w-full rounded-lg border bg-white/5 px-3 py-2 text-sm transition-colors duration-150",
              "placeholder:opacity-40",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error
                ? "border-red-500 focus:ring-red-500/40"
                : "border-current/20 focus:ring-current/30 focus:border-current/50",
              className
            )}
            aria-describedby={
              error ? `${id}-error` : helperText ? `${id}-helper` : undefined
            }
            aria-invalid={!!error}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 flex items-center text-current opacity-40 pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${id}-error`} className="text-xs text-red-400 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={`${id}-helper`} className="text-xs opacity-50">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

/* ── Textarea variant ──────────────────────────────────────────────────── */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  wrapperClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, wrapperClassName, label, helperText, error, id: idProp, ...props }, ref) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium leading-none opacity-80">
            {label}
            {props.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border bg-white/5 px-3 py-2 text-sm transition-colors duration-150 resize-none",
            "placeholder:opacity-40",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-red-500 focus:ring-red-500/40"
              : "border-current/20 focus:ring-current/30 focus:border-current/50",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}
        {!error && helperText && <p className="text-xs opacity-50">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
