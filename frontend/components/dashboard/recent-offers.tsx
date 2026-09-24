"use client";

import { Handshake } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Offer } from "@/lib/api";
import { formatCurrency, formatQuantity, formatRelativeTime } from "@/lib/format";

interface RecentOffersProps {
  offers: Offer[];
  isLoading: boolean;
}

export function RecentOffers({ offers, isLoading }: RecentOffersProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700/50">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Ofertas recientes
        </h2>
        <Link
          href="/ofertas"
          className="text-xs font-medium text-primary-500 hover:text-primary-600"
        >
          Ver todas →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Sin ofertas recientes"
          description="Cuando recibas o envíes ofertas aparecerán aquí."
        />
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {offers.map((offer) => (
            <li key={offer.id}>
              <Link
                href={`/ofertas/${offer.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
                      {formatQuantity(offer.quantity)}
                    </span>
                    <span className="text-xs text-neutral-400">×</span>
                    <span className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(offer.unit_price)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {formatRelativeTime(offer.created_at)}
                  </p>
                </div>
                <StatusBadge entity="offer" status={offer.status} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}