"use client";

import { Building2, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";

import { MatchScoreBar } from "./match-score-bar";
import type { Match } from "@/lib/api";
import { formatCurrency, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  /** Dirección: qué recurso estamos viendo. */
  direction: "surplus" | "need";
  /** ID del recurso propio (para excluir del link). */
  ownResourceId: number;
}

export function MatchCard({
  match,
  direction,
  ownResourceId,
}: MatchCardProps) {
  const counterpart = direction === "surplus" ? match.need : match.surplus;
  const counterpartHref =
    direction === "surplus"
      ? `/necesidades/${counterpart?.id}`
      : `/marketplace/${counterpart?.id}`;
  const counterpartLabel = direction === "surplus" ? "Comprador" : "Vendedor";

  if (!counterpart) return null;

  const scoreColor =
    match.score >= 80
      ? "text-success-500"
      : match.score >= 50
        ? "text-accent-500"
        : "text-neutral-500";

  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-700/50 dark:bg-neutral-900">
      {/* Header: score + contraparte */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            {counterpartLabel}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-neutral-400" />
            <h4 className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {match.counterpart_company.name}
            </h4>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
            <MapPin className="h-3 w-3" />
            <span>
              {match.counterpart_company.city},{" "}
              {match.counterpart_company.state}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Score
          </span>
          <span
            className={cn(
              "font-mono text-3xl font-medium leading-none",
              scoreColor
            )}
          >
            {match.score.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Condiciones del match */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Cantidad
          </p>
          <p className="mt-0.5 font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {formatQuantity(counterpart.quantity)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            {direction === "surplus" ? "Ofrece" : "Paga hasta"}
          </p>
          <p className="mt-0.5 font-mono text-sm text-neutral-900 dark:text-neutral-100">
            {formatCurrency(
              direction === "surplus"
                ? ("max_price" in counterpart
                    ? (counterpart.max_price ?? "0")
                    : "0")
                : ("unit_price" in counterpart
                  ? (counterpart.unit_price ?? "0")
                  : "0")
            )}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
          Desglose
        </p>
        <div className="space-y-2">
          <MatchScoreBar label="Material" value={match.breakdown.material} />
          <MatchScoreBar label="Cantidad" value={match.breakdown.quantity} />
          <MatchScoreBar label="Ubicación" value={match.breakdown.location} />
          <MatchScoreBar label="Precio" value={match.breakdown.price} />
          <MatchScoreBar
            label="Especificaciones"
            value={match.breakdown.specifications}
          />
        </div>
      </div>

      {/* Notas */}
      {match.notes.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-neutral-100 pt-4 text-xs text-neutral-500 dark:border-neutral-800">
          {match.notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neutral-400" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <Link
          href={counterpartHref}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600"
        >
          Ver {counterpartLabel.toLowerCase()}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}