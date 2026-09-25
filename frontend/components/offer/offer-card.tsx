"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import type { Offer } from "@/lib/api";
import { formatCurrency, formatQuantity, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface OfferCardProps {
  offer: Offer;
  currentCompanyId: number;
}

export function OfferCard({ offer, currentCompanyId }: OfferCardProps) {
  const isReceived = offer.offered_to_company_id === currentCompanyId;
  const direction = isReceived ? "Recibida" : "Enviada";
  const DirectionIcon = isReceived ? ArrowDownLeft : ArrowUpRight;
  const directionColor = isReceived
    ? "text-info-500 bg-info-50 dark:bg-info-500/10"
    : "text-neutral-500 bg-neutral-100 dark:bg-neutral-800";

  return (
    <Link
      href={`/ofertas/${offer.id}`}
      className="group flex flex-col rounded-lg border border-neutral-200 bg-white p-5 transition-all hover:border-primary-500/40 hover:shadow-md dark:border-neutral-700/50 dark:bg-neutral-900 dark:hover:border-primary-500/40 dark:hover:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              directionColor
            )}
          >
            <DirectionIcon className="h-3 w-3" />
            {direction}
          </span>
        </div>
        <StatusBadge entity="offer" status={offer.status} size="sm" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Cantidad
          </p>
          <p className="mt-0.5 font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {formatQuantity(offer.quantity)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Precio unitario
          </p>
          <p className="mt-0.5 font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {formatCurrency(offer.unit_price)}
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Total
          </p>
          <p className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {formatCurrency(
              parseFloat(offer.quantity) * parseFloat(offer.unit_price)
            )}
          </p>
        </div>
      </div>

      {offer.message && (
        <p className="mt-3 line-clamp-2 text-xs italic text-neutral-500">
          "{offer.message}"
        </p>
      )}

      <p className="mt-3 text-xs text-neutral-400">
        {formatRelativeTime(offer.created_at)}
      </p>
    </Link>
  );
}