"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Specification } from "@/lib/api";

export interface SpecValue {
  specification_id: number;
  value_number: string;
  value_text: string;
  value_boolean: string; // "true" | "false" | "" — para el select
}

interface SpecInputProps {
  spec: Specification;
  value: SpecValue;
  error?: string;
  onChange: (patch: Partial<SpecValue>) => void;
}

export function SpecInput({ spec, value, error, onChange }: SpecInputProps) {
  const label = spec.unit ? `${spec.name} (${spec.unit})` : spec.name;

  if (spec.data_type === "number") {
    return (
      <Input
        label={label}
        type="number"
        step="any"
        placeholder="Ej. 0.8"
        value={value.value_number}
        error={error}
        onChange={(e) => onChange({ value_number: e.target.value })}
        required={spec.is_required}
      />
    );
  }

  if (spec.data_type === "text") {
    return (
      <Input
        label={label}
        type="text"
        placeholder="Ej. Natural"
        value={value.value_text}
        error={error}
        onChange={(e) => onChange({ value_text: e.target.value })}
        required={spec.is_required}
      />
    );
  }

  // boolean
  return (
    <Select
      label={label}
      value={value.value_boolean}
      placeholder="Selecciona"
      options={[
        { value: "true", label: "Sí" },
        { value: "false", label: "No" },
      ]}
      error={error}
      onChange={(e) => onChange({ value_boolean: e.target.value })}
      required={spec.is_required}
    />
  );
}