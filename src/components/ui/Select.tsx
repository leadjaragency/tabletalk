"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
}

function Select({
  value,
  onValueChange,
  options,
  groups,
  placeholder = "Select an option",
  label,
  error,
  helperText,
  disabled,
  id: idProp,
  className,
  triggerClassName,
}: SelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const allOptions = options ?? groups?.flatMap((g) => g.options) ?? [];
  const selectedLabel = allOptions.find((o) => o.value === value)?.label;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium leading-none opacity-80">
          {label}
        </label>
      )}

      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          id={id}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm",
            "bg-white/5 border-current/20 transition-colors",
            "hover:border-current/40 focus:outline-none focus:ring-2 focus:ring-current/30",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "data-[placeholder]:opacity-40",
            error && "border-red-500 focus:ring-red-500/40",
            triggerClassName
          )}
          aria-invalid={!!error}
        >
          <RadixSelect.Value placeholder={placeholder}>
            {selectedLabel ?? <span className="opacity-40">{placeholder}</span>}
          </RadixSelect.Value>
          <RadixSelect.Icon asChild>
            <ChevronDown size={14} className="opacity-50 shrink-0" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className={cn(
              "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border shadow-xl",
              "data-[state=open]:animate-slide-down",
              "bg-[#1C1917] border-[#44403C] text-[#FAFAF9]" // defaults to admin dark; override via className on portal
            )}
          >
            <RadixSelect.ScrollUpButton className="flex items-center justify-center py-1 opacity-50">
              <ChevronUp size={14} />
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="p-1">
              {groups ? (
                groups.map((group) => (
                  <RadixSelect.Group key={group.label}>
                    <RadixSelect.Label className="px-2 py-1.5 text-xs font-semibold opacity-50 uppercase tracking-wider">
                      {group.label}
                    </RadixSelect.Label>
                    {group.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </RadixSelect.Group>
                ))
              ) : (
                options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </SelectItem>
                ))
              )}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex items-center justify-center py-1 opacity-50">
              <ChevronDown size={14} />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {!error && helperText && <p className="text-xs opacity-50">{helperText}</p>}
    </div>
  );
}

/* ── Internal SelectItem ─────────────────────────────────────────────────── */
function SelectItem({
  value,
  children,
  disabled,
  className,
}: {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <RadixSelect.Item
      value={value}
      disabled={disabled}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-lg px-8 py-2 text-sm outline-none",
        "transition-colors duration-100",
        "focus:bg-white/10",
        "data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed",
        className
      )}
    >
      <RadixSelect.ItemIndicator className="absolute left-2">
        <Check size={12} className="opacity-70" />
      </RadixSelect.ItemIndicator>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}

export { Select };
