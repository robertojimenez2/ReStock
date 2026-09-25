"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, offersApi, type Offer, type Surplus } from "@/lib/api";

interface OfferFormProps {
  surplus: Surplus;
  onSuccess: (offer: Offer) => void;
  onCancel?: () => void;
}

export function OfferForm({ surplus, onSuccess, onCancel }: OfferFormProps) {
  const [quantity, setQuantity] = useState(surplus.quantity);
  const [unitPrice, setUnitPrice] = useState(surplus.unit_price);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const offer = await offersApi.create({
        surplus_id: surplus.id,
        quantity,
        unit_price: unitPrice,
        message: message || null,
      });
      onSuccess(offer);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo enviar la oferta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md bg-neutral-50 p-3 text-xs dark:bg-neutral-800">
        <div className="flex justify-between">
          <span className="text-neutral-500">Publicado</span>
          <span className="font-mono text-neutral-700 dark:text-neutral-300">
            {surplus.quantity} × ${surplus.unit_price}
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
        placeholder="Comentario para el vendedor"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      {error && (
        <div className="rounded-md border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          Enviar oferta
        </Button>
      </div>
    </form>
  );
}