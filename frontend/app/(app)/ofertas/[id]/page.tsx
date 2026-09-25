"use client";

import { ArrowLeft, Handshake } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { OfferActions } from "@/components/offer/offer-actions";
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
  type Offer,
  type Surplus,
  type Transaction,
} from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";
import {
  formatAbsoluteDate,
  formatCurrency,
  formatRelativeTime,
} from "@/lib/format";

export default function OfferDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const offerId = Number(params.id);

  const [offer, setOffer] = useState<Offer | null>(null);
  const [surplus, setSurplus] = useState<Surplus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const o = await offersApi.get(offerId);
      setOffer(o);

      const s = await surplusesApi.get(o.surplus_id);
      setSurplus(s);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo cargar la oferta");
    } finally {
      setIsLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    if (Number.isFinite(offerId)) load();
  }, [offerId, load]);

  const handleAccepted = (updated: Offer, tx: Transaction) => {
    setOffer(updated);
    router.push(`/transacciones/${tx.id}`);
  };

  const handleCountered = (newOffer: Offer) => {
    router.push(`/ofertas/${newOffer.id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !offer || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/ofertas"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-6 dark:bg-danger-500/10">
          <p className="text-sm text-danger-700 dark:text-danger-500">
            {error ?? "Oferta no encontrada"}
          </p>
        </div>
      </div>
    );
  }

  const isSender = offer.offered_by_company_id === user.company_id;
  const isRecipient = offer.offered_to_company_id === user.company_id;
  const role = isSender ? "emisor" : isRecipient ? "receptor" : "observador";
  const total = parseFloat(offer.quantity) * parseFloat(offer.unit_price);

  return (
    <div className="space-y-6">
      <Link
        href="/ofertas"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a ofertas
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-neutral-400" />
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              Oferta #{offer.id}
            </h1>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Eres <span className="font-medium">{role}</span> en esta negociación
          </p>
        </div>
        <StatusBadge entity="offer" status={offer.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Condiciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    Cantidad
                  </p>
                  <p className="mt-1 font-mono text-lg text-neutral-900 dark:text-neutral-100">
                    {offer.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    Precio unitario
                  </p>
                  <p className="mt-1 font-mono text-lg text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(offer.unit_price)}
                  </p>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    Total
                  </p>
                  <p className="font-mono text-xl font-medium text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {offer.message && (
            <Card>
              <CardHeader>
                <CardTitle>Mensaje</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm italic text-neutral-700 dark:text-neutral-300">
                  "{offer.message}"
                </p>
              </CardContent>
            </Card>
          )}

          {surplus && (
            <Card>
              <CardHeader>
                <CardTitle>Sobre el excedente</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/marketplace/${surplus.id}`}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  Ver excedente #{surplus.id} →
                </Link>
                <dl className="mt-3 space-y-2">
                  <Row label="Cantidad publicada" value={`${surplus.quantity} ${surplus.unit}`} />
                  <Row
                    label="Precio publicado"
                    value={formatCurrency(surplus.unit_price)}
                  />
                  <Row label="Estado actual" value={surplus.status} />
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <OfferActions
                offer={offer}
                currentCompanyId={user.company_id}
                onUpdated={setOffer}
                onAccepted={handleAccepted}
                onCountered={handleCountered}
              />

              <div className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <dl className="space-y-2 text-xs">
                  <Row
                    label="Creada"
                    value={formatRelativeTime(offer.created_at)}
                  />
                  <Row
                    label="Actualizada"
                    value={formatAbsoluteDate(offer.updated_at)}
                  />
                </dl>
              </div>
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