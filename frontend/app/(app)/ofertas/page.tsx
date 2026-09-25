"use client";

import { Handshake } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { OfferCard } from "@/components/offer/offer-card";
import { OfferTabs } from "@/components/offer/offer-tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  offersApi,
  type Offer,
  type OfferStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendientes" },
  { value: "accepted", label: "Aceptadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "countered", label: "Contraofertadas" },
  { value: "cancelled", label: "Canceladas" },
  { value: "expired", label: "Expiradas" },
];

export default function OffersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [status, setStatus] = useState<OfferStatus | "">("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await offersApi.list({
        mine: true,
        status: status || undefined,
        limit: 200,
      });
      setOffers(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudieron cargar las ofertas");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const { received, sent } = useMemo(() => {
    if (!user) return { received: [], sent: [] };
    return {
      received: offers.filter(
        (o) => o.offered_to_company_id === user.company_id
      ),
      sent: offers.filter(
        (o) => o.offered_by_company_id === user.company_id
      ),
    };
  }, [offers, user]);

  const visible = tab === "received" ? received : sent;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Ofertas
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Negociaciones activas y cerradas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <OfferTabs
          value={tab}
          onChange={setTab}
          receivedCount={received.length}
          sentCount={sent.length}
        />
        <div className="w-56">
          <Select
            value={status}
            options={STATUS_OPTIONS}
            onChange={(e) => setStatus(e.target.value as OfferStatus | "")}
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
            <Skeleton key={i} className="h-52 w-full rounded-lg" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
          <EmptyState
            icon={Handshake}
            title={
              tab === "received"
                ? "Sin ofertas recibidas"
                : "Sin ofertas enviadas"
            }
            description={
              tab === "received"
                ? "Las ofertas que te hagan otras empresas aparecerán aquí."
                : "Cuando ofertes por un excedente del marketplace, aparecerá aquí."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((o) => (
            <OfferCard
              key={o.id}
              offer={o}
              currentCompanyId={user?.company_id ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}