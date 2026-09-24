import { CheckCircle2, XCircle } from "lucide-react";

import type { Specification } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SpecListProps {
  specifications: Specification[];
  values: {
    specification_id: number;
    value_number: string | null;
    value_text: string | null;
    value_boolean: boolean | null;
  }[];
  className?: string;
}

export function SpecList({
  specifications,
  values,
  className,
}: SpecListProps) {
  const valuesBySpecId = new Map(values.map((v) => [v.specification_id, v]));

  if (specifications.length === 0) return null;

  return (
    <dl className={cn("space-y-2", className)}>
      {specifications.map((spec) => {
        const value = valuesBySpecId.get(spec.id);
        const display = formatValue(spec, value);

        return (
          <div
            key={spec.id}
            className="flex items-baseline justify-between gap-4 border-b border-neutral-100 pb-2 last:border-0 dark:border-neutral-800"
          >
            <dt className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              {spec.name}
              {spec.unit && (
                <span className="text-xs text-neutral-400">
                  ({spec.unit})
                </span>
              )}
            </dt>
            <dd className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
              {display ?? (
                <span className="flex items-center gap-1 text-neutral-400">
                  <XCircle className="h-3 w-3" />
                  Sin especificar
                </span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function formatValue(
  spec: Specification,
  value:
    | {
        value_number: string | null;
        value_text: string | null;
        value_boolean: boolean | null;
      }
    | undefined
): string | null {
  if (!value) return null;

  if (spec.data_type === "number" && value.value_number !== null) {
    return value.value_number;
  }

  if (spec.data_type === "text" && value.value_text !== null) {
    return value.value_text;
  }

  if (spec.data_type === "boolean" && value.value_boolean !== null) {
    return value.value_boolean ? "Sí" : "No";
  }

  return null;
}