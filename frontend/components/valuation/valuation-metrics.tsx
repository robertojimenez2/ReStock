import { ArrowRight, Truck } from "lucide-react";

import type { Valuation } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ValuationMetricsProps {
  valuation: Valuation;
  className?: string;
  /** Muestra la fila de metadata (distancia, días, multiplicador). */
  showMetadata?: boolean;
}

export function ValuationMetrics({
  valuation,
  className,
  showMetadata = true,
}: ValuationMetricsProps) {
  const netIsPositive = parseFloat(valuation.net_value) >= 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Valor bruto
          </p>
          <p className="mt-1 font-mono text-lg text-neutral-900 dark:text-neutral-100">
            {formatCurrency(valuation.gross_value)}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Costo logístico
          </p>
          <p className="mt-1 font-mono text-lg text-danger-500">
            −{formatCurrency(valuation.logistics_cost)}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Valor neto
          </p>
          <p
            className={cn(
              "mt-1 font-mono text-lg font-medium",
              netIsPositive
                ? "text-success-500"
                : "text-danger-500"
            )}
          >
            {formatCurrency(valuation.net_value)}
          </p>
        </div>
      </div>

      {showMetadata && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-neutral-800">
          <span className="inline-flex items-center gap-1.5">
            <Truck className="h-3 w-3" />
            <span className="font-mono">
              {valuation.distance_km.toFixed(0)} km
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ArrowRight className="h-3 w-3" />
            <span>
              {valuation.buyer_company_city},{" "}
              {valuation.buyer_company_state}
            </span>
          </span>
          <span className="font-mono">
            {valuation.estimated_delivery_days}d
          </span>
          <span className="font-mono">
            ×{valuation.material_multiplier.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}