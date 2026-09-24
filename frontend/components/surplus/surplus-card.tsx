"use client";

import { MapPin, Package } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import type { Material, Surplus } from "@/lib/api";
import { formatCurrency, formatQuantity } from "@/lib/format";

interface SurplusCardProps {
  surplus: Surplus;
  material?: Material;
  href?: string
}

export function SurplusCard({ surplus, material, href }: SurplusCardProps) {
  return (
    <Link
      href={href ?? `/marketplace/${surplus.id}`}
      className="group flex flex-col rounded-lg border border-neutral-200 bg-white p-5 transition-all hover:border-primary-500/40 hover:shadow-md dark:border-neutral-700/50 dark:bg-neutral-900 dark:hover:border-primary-500/40 dark:hover:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 shrink-0 text-neutral-400" />
            <h3 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {material?.name ?? `Material #${surplus.material_id}`}
            </h3>
          </div>
          {material && (
            <p className="mt-0.5 text-xs text-neutral-500">
              {material.category}
            </p>
          )}
        </div>
        <StatusBadge entity="surplus" status={surplus.status} size="sm" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Cantidad
          </p>
          <p className="mt-0.5 font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {formatQuantity(surplus.quantity, surplus.unit)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Precio
          </p>
          <p className="mt-0.5 font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {formatCurrency(surplus.unit_price)}
            <span className="text-xs text-neutral-500">
              /{surplus.unit}
            </span>
          </p>
        </div>
      </div>

      {surplus.description && (
        <p className="mt-3 line-clamp-2 text-xs text-neutral-500">
          {surplus.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-1 text-xs text-neutral-400">
        <MapPin className="h-3 w-3" />
        <span>Ver detalle</span>
      </div>
    </Link>
  );
}