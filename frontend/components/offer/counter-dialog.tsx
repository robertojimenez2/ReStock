"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError, offersApi, type Offer } from "@/lib/api";

interface CounterDialogProps {
  open: boolean;
  onClose: () => void;
  offer: Offer;
  onSuccess: (newOffer: Offer) => void;
}

export function CounterDialog({
  open,
  onClose,
  offer,
  onSuccess,
}: CounterDialogProps) {
  const [quantity, setQuantity] = useState(offer.quantity);
  const [unitPrice, setUnitPrice] = useState(offer.unit_price);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const newOffer = await offersApi.counter(offer.id, {
        quantity,
        unit_price: unitPrice,
        message: message || null,
      });
      onSuccess(newOffer);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo enviar la contraoferta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Contraoferta"
      description="Propón nuevas condiciones al comprador."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-md bg-neutral-50 p-3 text-xs dark:bg-neutral-800">
          <div className="flex justify-between">
            <span className="text-neutral-500">Original</span>
            <span className="font-mono text-neutral-700 dark:text-neutral-300">
              {offer.quantity} × ${offer.unit_price}
            </span>
          </div>
        </div>

        <Input
          label="Cantidad"
          type="number"
          step="any"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <Input
          label="Precio unitario (MXN)"
          type="number"
          step="any"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          required
        />

        <Input
          label="Mensaje (opcional)"
          placeholder="Comentario para el comprador"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {error && (
          <div className="rounded-md border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Enviar contraoferta
          </Button>
        </div>
      </form>
    </Dialog>
  );
}