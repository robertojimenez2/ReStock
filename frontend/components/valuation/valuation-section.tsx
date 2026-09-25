"use client";

import { Calculator, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ValuationMetrics } from "./valuation-metrics";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, valuationApi, type Valuation } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ValuationSectionProps {
  surplusId: number;
  limit?: number;
}

export function ValuationSection({
  surplusId,
  limit = 20,
}: ValuationSectionProps) {
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await valuationApi.buyers(surplusId, limit);
      setValuations(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo calcular la valorización");
    } finally {
      setIsLoading(false);
    }
  }, [surplusId, limit]);

  useEffect(() => {
    if (Number.isFinite(surplusId)) load();
  }, [surplusId, load]);

  const best = valuations[0];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary-500" />
        <div>
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Valorización
          </h2>
          <p className="text-xs text-neutral-500">
            Valor neto estimado por comprador (bruto − logística)
          </p>
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
        <Skeleton className="h-72 w-full rounded-lg" />
      ) : valuations.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
          <EmptyState
            icon={Calculator}
            title="Sin compradores compatibles"
            description="Cuando existan empresas con necesidades activas del mismo material, verás aquí el valor neto de cada operación."
          />
        </div>
      ) : (
        <>
          {/* Mejor caso destacado */}
          <div className="rounded-lg border border-primary-500/30 bg-primary-50/50 p-5 dark:border-primary-500/30 dark:bg-primary-900/10">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary-500" />
              <p className="text-xs font-medium uppercase tracking-wide text-primary-700 dark:text-primary-300">
                Mejor valor neto
              </p>
              <span className="font-mono text-xs text-primary-700 dark:text-primary-300">
                · {best.buyer_company_name}
              </span>
            </div>
            <ValuationMetrics valuation={best} />
          </div>

          {/* Tabla de todos los compradores */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
            <table className="w-full">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left dark:border-neutral-700/50 dark:bg-neutral-800/50">
                <tr>
                  <th className="w-10 px-4 py-2.5"></th>
                  <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                    Comprador
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                    Ubicación
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                    Distancia
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                    Logístico
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                    Neto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {valuations.map((v, i) => (
                  <tr
                    key={v.buyer_company_id}
                    className={cn(
                      "transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                      i === 0 && "bg-primary-50/30 dark:bg-primary-500/5"
                    )}
                  >
                    <td className="px-4 py-3 text-center">
                      {i === 0 ? (
                        <Trophy className="inline h-3.5 w-3.5 text-primary-500" />
                      ) : (
                        <span className="font-mono text-xs text-neutral-400">
                          {i + 1}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {v.buyer_company_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {v.buyer_company_city}, {v.buyer_company_state}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-neutral-500">
                      {v.distance_km.toFixed(0)} km
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-danger-500">
                      −{formatCurrency(v.logistics_cost)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(v.net_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-neutral-400">
            * Estimación basada en centroides de estados. La distancia real
            puede variar ±15%. No incluye costo del material, solo logística.
          </p>
        </>
      )}
    </section>
  );
}