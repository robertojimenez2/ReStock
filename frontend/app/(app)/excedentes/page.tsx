"use client";

import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SurplusCard } from "@/components/surplus/surplus-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  materialsApi,
  surplusesApi,
  type Material,
  type Surplus,
  type SurplusStatus,
} from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Reservado" },
  { value: "sold", label: "Vendido" },
  { value: "inactive", label: "Inactivo" },
];

export default function MySurplusesPage() {
  const [surpluses, setSurpluses] = useState<Surplus[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [status, setStatus] = useState<SurplusStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await surplusesApi.list({
        mine: true,
        status: status || undefined,
        limit: 100,
      });
      setSurpluses(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudieron cargar tus excedentes");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    materialsApi
      .list({ limit: 200 })
      .then(setMaterials)
      .catch(() => {});
  }, []);

  const materialsById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Mis excedentes
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Administra los excedentes que publica tu empresa.
          </p>
        </div>
        <Link href="/excedentes/nuevo">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo excedente
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-56">
          <Select
            value={status}
            options={STATUS_OPTIONS}
            onChange={(e) => setStatus(e.target.value as SurplusStatus | "")}
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
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : surpluses.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
          <EmptyState
            icon={Package}
            title={
              status
                ? "Sin excedentes con ese estado"
                : "Aún no has publicado excedentes"
            }
            description={
              status
                ? "Prueba con otro filtro."
                : "Publica tu primer excedente para que otras empresas lo encuentren."
            }
            action={
              !status && (
                <Link href="/excedentes/nuevo">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Publicar excedente
                  </Button>
                </Link>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surpluses.map((s) => (
            <SurplusCard
              key={s.id}
              surplus={s}
              material={materialsById.get(s.material_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}