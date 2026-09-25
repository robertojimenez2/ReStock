"use client";

import { Ban, Check, Truck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ApiError,
  transactionsApi,
  type Transaction,
  type TransactionStatus,
} from "@/lib/api";

interface TransactionActionsProps {
  transaction: Transaction;
  onUpdated: (transaction: Transaction) => void;
}

interface ActionConfig {
  status: TransactionStatus;
  label: string;
  description: string;
  icon: typeof Check;
  variant: "primary" | "danger";
  requiresNotes: boolean;
}

const ACTIONS: Record<TransactionStatus, ActionConfig[]> = {
  pending: [
    {
      status: "in_transit",
      label: "Marcar en tránsito",
      description:
        "Confirma que la mercancía fue enviada. La contraparte recibirá una notificación.",
      icon: Truck,
      variant: "primary",
      requiresNotes: false,
    },
    {
      status: "completed",
      label: "Marcar completada",
      description:
        "Confirma que la operación cerró. El excedente pasará a estado Vendido.",
      icon: Check,
      variant: "primary",
      requiresNotes: false,
    },
    {
      status: "cancelled",
      label: "Cancelar transacción",
      description:
        "Cancela el acuerdo. El excedente volverá a estar disponible en el marketplace.",
      icon: Ban,
      variant: "danger",
      requiresNotes: true,
    },
  ],
  in_transit: [
    {
      status: "completed",
      label: "Marcar completada",
      description:
        "Confirma que la operación cerró. El excedente pasará a estado Vendido.",
      icon: Check,
      variant: "primary",
      requiresNotes: false,
    },
    {
      status: "cancelled",
      label: "Cancelar transacción",
      description:
        "Cancela el acuerdo. El excedente volverá a estar disponible en el marketplace.",
      icon: Ban,
      variant: "danger",
      requiresNotes: true,
    },
  ],
  completed: [],
  cancelled: [],
};

export function TransactionActions({
  transaction,
  onUpdated,
}: TransactionActionsProps) {
  const [selected, setSelected] = useState<ActionConfig | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = ACTIONS[transaction.status] ?? [];

  if (actions.length === 0) {
    return (
      <p className="text-xs text-neutral-400">
        Esta transacción está cerrada. No hay acciones disponibles.
      </p>
    );
  }

  const handleConfirm = async () => {
    if (!selected) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await transactionsApi.changeStatus(
        transaction.id,
        selected.status,
        selected.requiresNotes ? notes || undefined : undefined
      );
      onUpdated(updated);
      setSelected(null);
      setNotes("");
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo actualizar la transacción");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelected(null);
    setNotes("");
    setError(null);
  };

  return (
    <>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.status}
              variant={action.variant === "danger" ? "outline" : "primary"}
              className={
                action.variant === "danger"
                  ? "w-full text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10"
                  : "w-full"
              }
              onClick={() => setSelected(action)}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          );
        })}
      </div>

      <Dialog
        open={selected !== null}
        onClose={handleClose}
        title={selected?.label ?? ""}
        description={selected?.description}
        size="md"
      >
        <div className="space-y-4">
          {selected?.requiresNotes && (
            <Input
              label="Motivo (opcional)"
              placeholder="Explica por qué se cancela"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
            />
          )}

          {error && (
            <div className="rounded-md border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Volver
            </Button>
            <Button
              variant={selected?.variant === "danger" ? "danger" : "primary"}
              onClick={handleConfirm}
              loading={isSubmitting}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}