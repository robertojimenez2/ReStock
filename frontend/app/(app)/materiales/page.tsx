"use client";

import { Layers, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MaterialCard } from "@/components/material/material-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, materialsApi, type Material } from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";
import { cn } from "@/lib/utils";

type Tab = "active" | "pending" | "mine";

export default function MaterialsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("active");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "platform_admin";

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await materialsApi.list({ limit: 200 });
      setMaterials(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudieron cargar los materiales");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    return {
      active: materials.filter((m) => m.status === "active").length,
      pending: materials.filter((m) => m.status === "pending").length,
      mine: materials.filter(
        (m) => m.proposed_by_company_id === user?.company_id
      ).length,
    };
  }, [materials, user]);

  const visible = useMemo(() => {
    if (tab === "active") return materials.filter((m) => m.status === "active");
    if (tab === "pending")
      return materials.filter((m) => m.status === "pending");
    return materials.filter(
      (m) => m.proposed_by_company_id === user?.company_id
    );
  }, [materials, tab, user]);

  const tabs: { key: Tab; label: string; count: number; adminOnly?: boolean }[] =
    [
      { key: "active", label: "Catálogo", count: counts.active },
      { key: "mine", label: "Mis propuestas", count: counts.mine },
      { key: "pending", label: "Pendientes", count: counts.pending, adminOnly: true },
    ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Materiales
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {isAdmin
              ? "Catálogo central y propuestas de empresas."
              : "Catálogo de materiales. Puedes proponer nuevos."}
          </p>
        </div>
        <Link href="/materiales/nuevo">
          <Button>
            <Plus className="h-4 w-4" />
            {isAdmin ? "Nuevo material" : "Proponer material"}
          </Button>
        </Link>
      </div>

      <div className="inline-flex overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-primary-500 text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            )}
          >
            {t.label}
            <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-black/10 px-1.5 py-0.5 font-mono text-[10px] font-medium">
              {t.count}
            </span>
          </button>
        ))}
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
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
          <EmptyState
            icon={Layers}
            title={
              tab === "active"
                ? "Sin materiales en el catálogo"
                : tab === "pending"
                  ? "Sin propuestas pendientes"
                  : "Aún no has propuesto materiales"
            }
            description={
              tab === "active"
                ? "El catálogo está vacío."
                : tab === "pending"
                  ? "Todas las propuestas han sido revisadas."
                  : "Propón un material que falte en el catálogo."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => (
            <MaterialCard key={m.id} material={m} />
          ))}
        </div>
      )}
    </div>
  );
}