import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap",
  {
    variants: {
      color: {
        success:
          "bg-success-50 text-success-700 border-success-500/20 dark:bg-success-500/10 dark:text-success-500 dark:border-success-500/30",
        warning:
          "bg-warning-50 text-warning-700 border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-500 dark:border-warning-500/30",
        danger:
          "bg-danger-50 text-danger-700 border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-500 dark:border-danger-500/30",
        info:
          "bg-info-50 text-info-700 border-info-500/20 dark:bg-info-500/10 dark:text-info-500 dark:border-info-500/30",
        neutral:
          "bg-neutral-100 text-neutral-700 border-neutral-300/50 dark:bg-neutral-100/10 dark:text-neutral-300 dark:border-neutral-700/50",
        accent:
          "bg-accent-50 text-accent-900 border-accent-500/20 dark:bg-accent-500/10 dark:text-accent-500 dark:border-accent-500/30",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      color: "neutral",
      size: "md",
    },
  }
);

// Omit "color" del tipo HTML para evitar el conflicto con VariantProps
export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof badgeVariants> {
  icon?: React.ComponentType<{ className?: string }>;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, color, size, icon: Icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ color, size }), className)}
        {...props}
      >
        {Icon && <Icon className="h-3 w-3 shrink-0" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";