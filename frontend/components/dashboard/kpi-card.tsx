import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  href?: string;
  highlight?: boolean;
  className?: string;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  href,
  highlight = false,
  className,
}: KpiCardProps) {
  const content = (
    <div
      className={cn(
        "group rounded-lg border bg-white p-5 transition-colors dark:bg-neutral-900",
        highlight
          ? "border-accent-500/30 dark:border-accent-500/40"
          : "border-neutral-200 dark:border-neutral-700/50",
        href && "hover:border-primary-500/40 dark:hover:border-primary-500/40",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
        <Icon
          className={cn(
            "h-4 w-4",
            highlight ? "text-accent-500" : "text-neutral-400"
          )}
        />
      </div>

      <div className="mt-3 font-mono text-2xl font-medium text-neutral-900 dark:text-neutral-100">
        {value}
      </div>

      {hint && (
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {hint}
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}