"use client";

import { Target } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import type { Material, Need } from "@/lib/api";
import { formatCurrency, formatQuantity } from "@/lib/format";

interface NeedCardProps {
  need: Need;
  material?: Material;
  href?: string;
}

export function NeedCard({ need, material, href }: NeedCardProps) {
  return (
    <Link
      href={href ?? `/necesidades/${need.id}`}
      className="group flex flex-col rounded-lg border border-neutral-200 bg-white p-5 transition-all hover:border-primary-500/40 hover:shadow-md dark:border-neutral-700/50 dark:bg-neutral-900 dark:hover:border-primary-500/40 dark:hover:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 shrink-0 text-neutral-400" />
            <h3 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {material?.name ?? `Material #${need.material_id}`}
            </h3>
          </div>
          {material && (
            <p className="mt-0.5 text-xs text-neutral-500">
              {material.category}
            </p>
          )}
        </div>
        <StatusBadge entity="need" status={need.status} size="sm" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Cantidad
          </p>
          <p className="mt-0.5 font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {formatQuantity(need.quantity, need.unit)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Precio máximo
          </p>
          <p className="mt-0.5 font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {need.max_price ? (
              <>
                {formatCurrency(need.max_price)}
                <span className="text-xs text-neutral-500">
                  /{need.unit}
                </span>
              </>
            ) : (
              <span className="text-neutral-400">Sin techo</span>
            )}
          </p>
        </div>
      </div>

      {need.description && (
        <p className="mt-3 line-clamp-2 text-xs text-neutral-500">
          {need.description}
        </p>
      )}
    </Link>
  );
}