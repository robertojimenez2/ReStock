"use client";

import { Truck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { TransactionCard } from "@/components/transaction/transaction-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  transactionsApi,
  type Transaction,
  type TransactionStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendientes" },
  { value: "in_transit", label: "En tránsito" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
];

export default function TransactionsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transactionsApi.list({
        status: status || undefined,
        limit: 200,
      });
      setTransactions(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudieron cargar las transacciones");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Transacciones
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Operaciones cerradas a partir de ofertas aceptadas.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-56">
          <Select
            value={status}
            options={STATUS_OPTIONS}
            onChange={(e) =>
              setStatus(e.target.value as TransactionStatus | "")
            }
          />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
          <EmptyState
            icon={Truck}
            title={
              status
                ? "Sin transacciones con ese estado"
                : "Aún no tienes transacciones"
            }
            description={
              status
                ? "Prueba con otro filtro."
                : "Cuando aceptes o te acepten una oferta, aparecerá aquí."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {transactions.map((t) => (
            <TransactionCard
              key={t.id}
              transaction={t}
              currentCompanyId={user?.company_id ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}