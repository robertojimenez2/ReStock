import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, options, placeholder, label, hint, error, id, ...props },
    ref
  ) => {
    const inputId = id ?? props.name;
    const hasError = Boolean(error);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium uppercase tracking-wide text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              "h-10 w-full appearance-none rounded-md border bg-white pl-3 pr-9 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "dark:bg-neutral-900 dark:text-neutral-100 dark:focus-visible:ring-offset-neutral-950",
              hasError
                ? "border-danger-500 focus-visible:ring-danger-500"
                : "border-neutral-300 dark:border-neutral-700",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        </div>
        {error && <p className="text-xs text-danger-500">{error}</p>}
        {!error && hint && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";