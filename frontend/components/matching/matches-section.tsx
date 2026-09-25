"use client";

import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { MatchCard } from "./match-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, matchesApi, type Match } from "@/lib/api";

interface MatchesSectionProps {
  resourceId: number;
  direction: "surplus" | "need";
  /** Límite de matches a mostrar. Default 6. */
  limit?: number;
}

export function MatchesSection({
  resourceId,
  direction,
  limit = 6,
}: MatchesSectionProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data =
        direction === "surplus"
          ? await matchesApi.forSurplus(resourceId, { limit })
          : await matchesApi.forNeed(resourceId, { limit });
      setMatches(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudieron cargar las coincidencias");
    } finally {
      setIsLoading(false);
    }
  }, [resourceId, direction, limit]);

  useEffect(() => {
    if (Number.isFinite(resourceId)) load();
  }, [resourceId, load]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-500" />
          <div>
            <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Coincidencias
            </h2>
            <p className="text-xs text-neutral-500">
              {direction === "surplus"
                ? "Empresas que necesitan este material"
                : "Excedentes que cumplen tus requisitos"}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-6 dark:bg-danger-500/10">
          <p className="text-sm text-danger-700 dark:text-danger-500">
            {error}
          </p>
          <Button variant="ghost" size="sm" onClick={load} className="mt-2">
            Reintentar
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
          <EmptyState
            icon={Sparkles}
            title="Sin coincidencias por ahora"
            description={
              direction === "surplus"
                ? "Cuando otras empresas publiquen necesidades compatibles con este excedente, aparecerán aquí."
                : "Cuando se publiquen excedentes compatibles con tu necesidad, aparecerán aquí."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {matches.map((m) => (
            <MatchCard
              key={
                direction === "surplus"
                  ? `need-${m.need?.id ?? m.counterpart_company.id}`
                  : `surplus-${m.surplus?.id ?? m.counterpart_company.id}`
              }
              match={m}
              direction={direction}
              ownResourceId={resourceId}
            />
          ))}
        </div>
      )}
    </section>
  );
}