import { cn } from "@/lib/utils";

interface MatchScoreBarProps {
  label: string;
  value: number;
  className?: string;
}

export function MatchScoreBar({ label, value, className }: MatchScoreBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 80
      ? "bg-success-500"
      : pct >= 50
        ? "bg-accent-500"
        : "bg-neutral-300 dark:bg-neutral-600";

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
        <span className="font-mono text-neutral-700 dark:text-neutral-300">
          {value.toFixed(0)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}