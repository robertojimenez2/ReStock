"use client";

import { Calculator } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ValuationMetrics } from "./valuation-metrics";
import { ApiError, valuationApi, type Valuation } from "@/lib/api";

interface ValuationQuickViewProps {
  surplusId: number;
}

export function ValuationQuickView({ surplusId }: ValuationQuickViewProps) {
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Sin buyer_company_id → el backend usa la empresa del usuario autenticado
      const data = await valuationApi.forSurplus(surplusId);
      setValuation(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo calcular el costo estimado");
    } finally {
      setIsLoading(false);
    }
  }, [surplusId]);

  useEffect(() => {
    if (Number.isFinite(surplusId)) load();
  }, [surplusId]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700/50 dark:bg-neutral-900">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-3 h-8 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    );
  }

  if (error || !valuation) {
    return null; // silencioso: no rompemos el detalle
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-700/50 dark:bg-neutral-900">
      <div className="mb-3 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary-500" />
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Costo estimado para tu empresa
        </p>
      </div>

      <ValuationMetrics valuation={valuation} showMetadata={false} />

      <div className="mt-3 border-t border-neutral-100 pt-3 text-[11px] text-neutral-500 dark:border-neutral-800">
        {valuation.distance_km.toFixed(0)} km ·{" "}
        {valuation.estimated_delivery_days} día
        {valuation.estimated_delivery_days === 1 ? "" : "s"} · entrega a{" "}
        {valuation.buyer_company_city}
      </div>
    </div>
  );
}