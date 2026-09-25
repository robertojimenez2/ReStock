"use client";

import { ArrowDownLeft, ArrowUpRight, Truck } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";
import type { Transaction } from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TransactionCardProps {
  transaction: Transaction;
  currentCompanyId: number;
}

export function TransactionCard({
  transaction,
  currentCompanyId,
}: TransactionCardProps) {
  const isBuyer = transaction.buyer_company_id === currentCompanyId;
  const role = isBuyer ? "Compra" : "Venta";
  const RoleIcon = isBuyer ? ArrowDownLeft : ArrowUpRight;
  const roleColor = isBuyer
    ? "text-info-500 bg-info-50 dark:bg-info-500/10"
    : "text-success-500 bg-success-50 dark:bg-success-500/10";

  return (
    <Link
      href={`/transacciones/${transaction.id}`}
      className="group flex flex-col rounded-lg border border-neutral-200 bg-white p-5 transition-all hover:border-primary-500/40 hover:shadow-md dark:border-neutral-700/50 dark:bg-neutral-900 dark:hover:border-primary-500/40 dark:hover:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              roleColor
            )}
          >
            <RoleIcon className="h-3 w-3" />
            {role}
          </span>
          <span className="text-xs text-neutral-400">
            #{transaction.id}
          </span>
        </div>
        <StatusBadge entity="transaction" status={transaction.status} size="sm" />
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Total
          </p>
          <p className="mt-0.5 font-mono text-lg font-medium text-neutral-900 dark:text-neutral-100">
            {formatCurrency(transaction.total_amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
            Cantidad
          </p>
          <p className="mt-0.5 font-mono text-sm text-neutral-700 dark:text-neutral-300">
            {transaction.quantity} × {formatCurrency(transaction.unit_price)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-100 pt-3 text-xs text-neutral-400 dark:border-neutral-800">
        <Truck className="h-3 w-3" />
        <span>{formatRelativeTime(transaction.created_at)}</span>
      </div>
    </Link>
  );
}