"use client";

import { Layers } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import type { Material } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";

interface MaterialCardProps {
  material: Material;
  href?: string;
}

export function MaterialCard({ material, href }: MaterialCardProps) {
  return (
    <Link
      href={href ?? `/materiales/${material.id}`}
      className="group flex flex-col rounded-lg border border-neutral-200 bg-white p-5 transition-all hover:border-primary-500/40 hover:shadow-md dark:border-neutral-700/50 dark:bg-neutral-900 dark:hover:border-primary-500/40 dark:hover:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 shrink-0 text-neutral-400" />
            <h3 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {material.name}
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">
            {material.category}
          </p>
        </div>
        <StatusBadge entity="material" status={material.status} size="sm" />
      </div>

      {material.description && (
        <p className="mt-3 line-clamp-2 text-xs text-neutral-500">
          {material.description}
        </p>
      )}

      <p className="mt-3 text-xs text-neutral-400">
        {formatRelativeTime(material.created_at)}
      </p>
    </Link>
  );
}