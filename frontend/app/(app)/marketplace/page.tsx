"use client";

import { Package, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FiltersBar, type Filters } from "@/components/surplus/filters-bar";
import { SurplusCard } from "@/components/surplus/surplus-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
    materialsApi,
  surplusesApi,
  type Material,
  type Surplus,
} from "@/lib/api";

const PAGE_SIZE = 12;

const EMPTY_FILTERS: Filters = {
  search: "",
  material_id: "",
  status: "",
  min_price: "",
  max_price: "",
};

export default function MarketplacePage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [skip, setSkip] = useState(0);

  const [surpluses, setSurpluses] = useState<Surplus[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar materiales una sola vez
  useEffect(() => {
    materialsApi
      .list({ limit: 200 })
      .then(setMaterials)
      .catch(() => {
        /* silencioso: sin materiales, sin filtro de material */
      });
  }, []);

  // Cargar surpluses cuando cambian filtros o página
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await surplusesApi.list({
        status: (filters.status || undefined) as Surplus["status"] | undefined,
        material_id: filters.material_id
          ? Number(filters.material_id)
          : undefined,
        min_price: filters.min_price ? Number(filters.min_price) : undefined,
        max_price: filters.max_price ? Number(filters.max_price) : undefined,
        skip,
        limit: PAGE_SIZE,
      });
      setSurpluses(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo cargar el marketplace");
    } finally {
      setIsLoading(false);
    }
  }, [filters, skip]);

  useEffect(() => {
    load();
  }, [load]);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setSkip(0);
  }, [
    filters.status,
    filters.material_id,
    filters.min_price,
    filters.max_price,
  ]);

  // Búsqueda client-side
  const visible = useMemo(() => {
    if (!filters.search.trim()) return surpluses;
    const q = filters.search.toLowerCase().trim();
    return surpluses.filter((s) => {
      const material = materials.find((m) => m.id === s.material_id);
      const haystack = [
        material?.name ?? "",
        material?.category ?? "",
        s.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [surpluses, materials, filters.search]);

  const materialsById = useMemo(
    () => new Map(materials.map((m) => [m.id, m])),
    [materials]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Marketplace
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Excedentes industriales disponibles de empresas en México.
        </p>
      </div>

      <FiltersBar
        filters={filters}
        materials={materials}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

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
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
          <EmptyState
            icon={Search}
            title="Sin resultados"
            description={
              filters.search ||
              filters.material_id ||
              filters.status ||
              filters.min_price ||
              filters.max_price
                ? "Ningún excedente coincide con los filtros aplicados."
                : "Todavía no hay excedentes publicados."
            }
            action={
              filters.search ||
              filters.material_id ||
              filters.status ||
              filters.min_price ||
              filters.max_price ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                >
                  Limpiar filtros
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((s) => (
              <SurplusCard
                key={s.id}
                surplus={s}
                material={materialsById.get(s.material_id)}
              />
            ))}
          </div>

          <Pagination
            skip={skip}
            limit={PAGE_SIZE}
            hasNext={surpluses.length === PAGE_SIZE}
            onPageChange={setSkip}
            />
        </>
      )}
    </div>
  );
}