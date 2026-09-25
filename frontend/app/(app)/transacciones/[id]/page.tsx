"use client";

import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { TransactionActions } from "@/components/transaction/transaction-actions";
import { TransactionTimeline } from "@/components/transaction/transaction-timeline";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ApiError,
  offersApi,
  surplusesApi,
  transactionsApi,
  type Offer,
  type Surplus,
  type Transaction,
} from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";
import { formatAbsoluteDate, formatCurrency } from "@/lib/format";

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const transactionId = Number(params.id);

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [surplus, setSurplus] = useState<Surplus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tx = await transactionsApi.get(transactionId);
      setTransaction(tx);

      const [off, sur] = await Promise.all([
        offersApi.get(tx.offer_id),
        surplusesApi.get(tx.surplus_id),
      ]);
      setOffer(off);
      setSurplus(sur);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo cargar la transacción");
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    if (Number.isFinite(transactionId)) load();
  }, [transactionId, load]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !transaction || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/transacciones"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-6 dark:bg-danger-500/10">
          <p className="text-sm text-danger-700 dark:text-danger-500">
            {error ?? "Transacción no encontrada"}
          </p>
        </div>
      </div>
    );
  }

  const isBuyer = transaction.buyer_company_id === user.company_id;
  const role = isBuyer ? "Comprador" : "Vendedor";
  const RoleIcon = isBuyer ? ArrowDownLeft : ArrowUpRight;

  return (
    <div className="space-y-6">
      <Link
        href="/transacciones"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a transacciones
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <RoleIcon className="h-5 w-5 text-neutral-400" />
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              Transacción #{transaction.id}
            </h1>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Tu rol: <span className="font-medium">{role}</span>
          </p>
        </div>
        <StatusBadge entity="transaction" status={transaction.status} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <TransactionTimeline status={transaction.status} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la operación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    Cantidad
                  </p>
                  <p className="mt-1 font-mono text-lg text-neutral-900 dark:text-neutral-100">
                    {transaction.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    Precio unitario
                  </p>
                  <p className="mt-1 font-mono text-lg text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(transaction.unit_price)}
                  </p>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    Total de la operación
                  </p>
                  <p className="font-mono text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(transaction.total_amount)}
                  </p>
                </div>
              </div>

              {transaction.notes && (
                <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    Notas
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                    {transaction.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos relacionados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {offer && (
                <Link
                  href={`/ofertas/${offer.id}`}
                  className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm transition-colors hover:border-primary-500/40 dark:border-neutral-700/50"
                >
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Oferta origen
                  </span>
                  <span className="font-mono text-xs text-neutral-400">
                    #{offer.id} →
                  </span>
                </Link>
              )}
              {surplus && (
                <Link
                  href={`/marketplace/${surplus.id}`}
                  className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm transition-colors hover:border-primary-500/40 dark:border-neutral-700/50"
                >
                  <span className="text-neutral-700 dark:text-neutral-300">
                    Excedente
                  </span>
                  <span className="font-mono text-xs text-neutral-400">
                    #{surplus.id} →
                  </span>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <TransactionActions
                transaction={transaction}
                onUpdated={setTransaction}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <dl className="space-y-2 text-xs">
                <Row
                  label="Creada"
                  value={formatAbsoluteDate(transaction.created_at)}
                />
                <Row
                  label="Actualizada"
                  value={formatAbsoluteDate(transaction.updated_at)}
                />
                {transaction.completed_at && (
                  <Row
                    label="Completada"
                    value={formatAbsoluteDate(transaction.completed_at)}
                  />
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-mono text-neutral-700 dark:text-neutral-300">
        {value}
      </dd>
    </div>
  );
}