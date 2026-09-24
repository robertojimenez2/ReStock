"use client";

import {
  Handshake,
  Package,
  Target,
  Truck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentOffers } from "@/components/dashboard/recent-offers";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardApi, ApiError, type Dashboard } from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";
import { formatCurrency } from "@/lib/format";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const dashboard = await dashboardApi.get();
      setData(dashboard);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("No se pudo cargar el dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-6 dark:bg-danger-500/10">
        <p className="text-sm text-danger-700 dark:text-danger-500">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-3 text-sm font-medium text-danger-700 underline hover:no-underline dark:text-danger-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Resumen de actividad de {user?.full_name.split(" ")[0] ?? "tu empresa"}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </>
        ) : (
          <>
            <KpiCard
              icon={Package}
              label="Excedentes"
              value={String(data.surpluses.total)}
              hint={`${data.surpluses.available} disponibles · ${formatCurrency(data.surpluses.total_value_available)}`}
              href="/excedentes"
            />
            <KpiCard
              icon={Target}
              label="Necesidades"
              value={String(data.needs.total)}
              hint={`${data.needs.active} activas`}
              href="/necesidades"
            />
            <KpiCard
              icon={Handshake}
              label="Ofertas"
              value={String(
                data.offers.pending_received + data.offers.pending_sent
              )}
              hint={
                data.offers.pending_received > 0
                  ? `${data.offers.pending_received} por responder`
                  : "Sin acciones pendientes"
              }
              href="/ofertas"
              highlight={data.offers.pending_received > 0}
            />
            <KpiCard
              icon={Truck}
              label="Transacciones"
              value={String(
                data.transactions.pending +
                  data.transactions.in_transit +
                  data.transactions.completed
              )}
              hint={`${data.transactions.completed} completadas · ${formatCurrency(data.transactions.total_completed_amount)}`}
              href="/transacciones"
            />
          </>
        )}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentOffers
          offers={data?.recent_offers ?? []}
          isLoading={isLoading}
        />
        <RecentTransactions
          transactions={data?.recent_transactions ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}