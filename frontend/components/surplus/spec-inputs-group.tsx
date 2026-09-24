"use client";

import { Settings2 } from "lucide-react";

import { SpecInput, type SpecValue } from "./spec-input";
import type { Specification } from "@/lib/api";

interface SpecInputsGroupProps {
  specifications: Specification[];
  values: Record<number, SpecValue>;
  errors: Record<number, string>;
  onChange: (specificationId: number, patch: Partial<SpecValue>) => void;
}

export function SpecInputsGroup({
  specifications,
  values,
  errors,
  onChange,
}: SpecInputsGroupProps) {
  if (specifications.length === 0) return null;

  const required = specifications.filter((s) => s.is_required);
  const optional = specifications.filter((s) => !s.is_required);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-neutral-400" />
        <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Especificaciones técnicas
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {required.map((spec) => (
          <SpecInput
            key={spec.id}
            spec={spec}
            value={values[spec.id]}
            error={errors[spec.id]}
            onChange={(patch) => onChange(spec.id, patch)}
          />
        ))}
        {optional.map((spec) => (
          <SpecInput
            key={spec.id}
            spec={spec}
            value={values[spec.id]}
            error={errors[spec.id]}
            onChange={(patch) => onChange(spec.id, patch)}
          />
        ))}
      </div>
    </div>
  );
}