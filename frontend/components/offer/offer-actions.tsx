"use client";

import { Ban, Check, Repeat, X } from "lucide-react";
import { useState } from "react";

import { CounterDialog } from "./counter-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ApiError, offersApi, type Offer, type Transaction } from "@/lib/api";

interface OfferActionsProps {
  offer: Offer;
  currentCompanyId: number;
  onUpdated: (offer: Offer) => void;
  onAccepted: (offer: Offer, transaction: Transaction) => void;
  onCountered: (newOffer: Offer) => void;
}

export function OfferActions({
  offer,
  currentCompanyId,
  onUpdated,
  onAccepted,
  onCountered,
}: OfferActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "accept" | "reject" | "cancel" | null
  >(null);

  const isSender = offer.offered_by_company_id === currentCompanyId;
  const isRecipient = offer.offered_to_company_id === currentCompanyId;
  const isPending = offer.status === "pending";

  if (!isPending) {
    return null;
  }

  const run = async (
    key: string,
    fn: () => Promise<void>
  ) => {
    setLoading(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("Acción fallida");
    } finally {
      setLoading(null);
    }
  };

  const handleAccept = () =>
    run("accept", async () => {
      const result = await offersApi.accept(offer.id);
      onAccepted(result.offer, result.transaction);
    });

  const handleReject = () =>
    run("reject", async () => {
      const updated = await offersApi.reject(offer.id);
      onUpdated(updated);
    });

  const handleCancel = () =>
    run("cancel", async () => {
      const updated = await offersApi.cancel(offer.id);
      onUpdated(updated);
    });

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {isRecipient && (
            <>
              <Button
                onClick={() => setConfirmAction("accept")}
                loading={loading === "accept"}
                className="flex-1"
              >
                <Check className="h-4 w-4" />
                Aceptar
              </Button>

              <Button
                variant="outline"
                onClick={() => setCounterOpen(true)}
                disabled={loading !== null}
              >
                <Repeat className="h-4 w-4" />
                Contraofertar
              </Button>

              <Button
                variant="ghost"
                onClick={() => setConfirmAction("reject")}
                loading={loading === "reject"}
                className="text-danger-500"
              >
                <X className="h-4 w-4" />
                Rechazar
              </Button>
            </>
          )}

          {isSender && (
            <Button
              variant="outline"
              onClick={() => setConfirmAction("cancel")}
              loading={loading === "cancel"}
              className="w-full text-danger-500"
            >
              <Ban className="h-4 w-4" />
              Cancelar oferta
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
            {error}
          </div>
        )}
      </div>

      {/* Confirmación de aceptar/rechazar/cancelar */}
      <Dialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction === "accept"
            ? "Aceptar oferta"
            : confirmAction === "reject"
              ? "Rechazar oferta"
              : "Cancelar oferta"
        }
        description={
          confirmAction === "accept"
            ? "Se creará una transacción y el excedente quedará reservado. Esta acción no se puede deshacer."
            : confirmAction === "reject"
              ? "El emisor recibirá una notificación de rechazo."
              : "El destinatario recibirá una notificación de cancelación."
        }
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setConfirmAction(null)}
            disabled={loading !== null}
          >
            Volver
          </Button>
          <Button
            variant={confirmAction === "accept" ? "primary" : "danger"}
            loading={loading !== null}
            onClick={async () => {
              if (confirmAction === "accept") await handleAccept();
              else if (confirmAction === "reject") await handleReject();
              else if (confirmAction === "cancel") await handleCancel();
              setConfirmAction(null);
            }}
          >
            {confirmAction === "accept"
              ? "Aceptar y crear transacción"
              : confirmAction === "reject"
                ? "Rechazar"
                : "Cancelar oferta"}
          </Button>
        </div>
      </Dialog>

      {/* Contraoferta */}
      <CounterDialog
        open={counterOpen}
        onClose={() => setCounterOpen(false)}
        offer={offer}
        onSuccess={onCountered}
      />
    </>
  );
}