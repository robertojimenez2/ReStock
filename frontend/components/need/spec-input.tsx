"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Specification } from "@/lib/api";
import { cn } from "@/lib/utils";

export type NumberMode = "exact" | "range";

export interface NeedSpecValue {
  specification_id: number;
  mode: NumberMode;
  value_number: string;
  min_value_number: string;
  max_value_number: string;
  value_text: string;
  value_boolean: string;
}

interface SpecInputProps {
  spec: Specification;
  value: NeedSpecValue;
  error?: string;
  onChange: (patch: Partial<NeedSpecValue>) => void;
}

export function SpecInput({ spec, value, error, onChange }: SpecInputProps) {
  const label = spec.unit ? `${spec.name} (${spec.unit})` : spec.name;

  if (spec.data_type === "number") {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
            {label}
            {spec.is_required && (
              <span className="ml-1 text-danger-500">*</span>
            )}
          </label>

          <div className="inline-flex overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
            <ModeButton
              active={value.mode === "exact"}
              onClick={() => onChange({ mode: "exact" })}
            >
              Exacto
            </ModeButton>
            <ModeButton
              active={value.mode === "range"}
              onClick={() => onChange({ mode: "range" })}
            >
              Rango
            </ModeButton>
          </div>
        </div>

        {value.mode === "exact" ? (
          <Input
            type="number"
            step="any"
            placeholder="Ej. 0.8"
            value={value.value_number}
            error={error}
            onChange={(e) => onChange({ value_number: e.target.value })}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              step="any"
              placeholder="Mínimo"
              value={value.min_value_number}
              error={error}
              onChange={(e) =>
                onChange({ min_value_number: e.target.value })
              }
            />
            <Input
              type="number"
              step="any"
              placeholder="Máximo"
              value={value.max_value_number}
              onChange={(e) =>
                onChange({ max_value_number: e.target.value })
              }
            />
          </div>
        )}

        {error && <p className="text-xs text-danger-500">{error}</p>}
      </div>
    );
  }

  if (spec.data_type === "text") {
    return (
      <Input
        label={`${label}${spec.is_required ? " *" : ""}`}
        type="text"
        placeholder="Ej. Natural"
        value={value.value_text}
        error={error}
        onChange={(e) => onChange({ value_text: e.target.value })}
      />
    );
  }

  return (
    <Select
      label={`${label}${spec.is_required ? " *" : ""}`}
      value={value.value_boolean}
      placeholder="Selecciona"
      options={[
        { value: "true", label: "Sí" },
        { value: "false", label: "No" },
      ]}
      error={error}
      onChange={(e) => onChange({ value_boolean: e.target.value })}
    />
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
        active
          ? "bg-primary-500 text-white"
          : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
      )}
    >
      {children}
    </button>
  );
}