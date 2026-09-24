"use client";

import { Truck } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Transaction } from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@/lib/format";

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export function RecentTransactions({
  transactions,
  isLoading,
}: RecentTransactionsProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700/50">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Transacciones recientes
        </h2>
        <Link
          href="/transacciones"
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
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Sin transacciones"
          description="Las operaciones cerradas aparecerán aquí."
        />
      ) : (
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {transactions.map((tx) => (
            <li key={tx.id}>
              <Link
                href={`/transacciones/${tx.id}`}
                className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(tx.total_amount)}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {formatRelativeTime(tx.created_at)}
                  </p>
                </div>
                <StatusBadge
                  entity="transaction"
                  status={tx.status}
                  size="sm"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}