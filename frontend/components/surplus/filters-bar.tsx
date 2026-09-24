"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Material, SurplusStatus } from "@/lib/api";

export interface Filters {
  search: string;
  material_id: string;
  status: string;
  min_price: string;
  max_price: string;
}

interface FiltersBarProps {
  filters: Filters;
  materials: Material[];
  onChange: (filters: Filters) => void;
  onClear: () => void;
}

const STATUS_OPTIONS = [
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Reservado" },
  { value: "sold", label: "Vendido" },
  { value: "inactive", label: "Inactivo" },
];

export function FiltersBar({
  filters,
  materials,
  onChange,
  onClear,
}: FiltersBarProps) {
  const hasActiveFilters =
    filters.search ||
    filters.material_id ||
    filters.status ||
    filters.min_price ||
    filters.max_price;

  const update = (patch: Partial<Filters>) => {
    onChange({ ...filters, ...patch });
  };

  const materialOptions = [
    { value: "", label: "Todos los materiales" },
    ...materials.map((m) => ({ value: String(m.id), label: m.name })),
  ];

  const statusOptions = [
    { value: "", label: "Cualquier estado" },
    ...STATUS_OPTIONS,
  ];

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-900">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>

        <Select
          value={filters.material_id}
          options={materialOptions}
          onChange={(e) => update({ material_id: e.target.value })}
        />

        <Select
          value={filters.status}
          options={statusOptions}
          onChange={(e) => update({ status: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min $"
            value={filters.min_price}
            onChange={(e) => update({ min_price: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Max $"
            value={filters.max_price}
            onChange={(e) => update({ max_price: e.target.value })}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-neutral-500"
          >
            <X className="h-3 w-3" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}