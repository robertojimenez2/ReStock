import { Ban, Check, PackageCheck, Truck } from "lucide-react";

import type { TransactionStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TransactionTimelineProps {
  status: TransactionStatus;
  className?: string;
}

const STEPS = [
  { key: "pending", label: "Pendiente", icon: PackageCheck },
  { key: "in_transit", label: "En tránsito", icon: Truck },
  { key: "completed", label: "Completada", icon: Check },
] as const;

export function TransactionTimeline({
  status,
  className,
}: TransactionTimelineProps) {
  if (status === "cancelled") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border border-danger-500/20 bg-danger-50 p-4 dark:border-danger-500/30 dark:bg-danger-500/10",
          className
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-500/20 text-danger-500">
          <Ban className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-danger-700 dark:text-danger-500">
            Transacción cancelada
          </p>
          <p className="text-xs text-danger-700/70 dark:text-danger-500/70">
            El excedente volvió a estar disponible.
          </p>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {STEPS.map((step, i) => {
        const isDone = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  isDone
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-neutral-300 bg-white text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide",
                  isCurrent
                    ? "text-primary-500"
                    : isDone
                      ? "text-neutral-700 dark:text-neutral-300"
                      : "text-neutral-400"
                )}
              >
                {step.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 -translate-y-3.5 transition-colors",
                  i < currentIdx
                    ? "bg-primary-500"
                    : "bg-neutral-200 dark:bg-neutral-700"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}