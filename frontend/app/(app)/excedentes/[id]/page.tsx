"use client";

import { ArrowLeft, Pencil, Package } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { SurplusActions } from "@/components/surplus/surplus-actions";
import { SpecList } from "@/components/surplus/spec-list";
import { Button } from "@/components/ui/button";
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
  materialsApi,
  specificationsApi,
  surplusesApi,
  type Material,
  type Specification,
  type Surplus,
  type SurplusStatus,
} from "@/lib/api";
import { formatCurrency, formatQuantity, formatRelativeTime } from "@/lib/format";
import { MatchesSection } from "@/components/matching/matches-section";
import { ValuationSection } from "@/components/valuation/valuation-section";

export default function MySurplusDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const surplusId = Number(params.id);

  const [surplus, setSurplus] = useState<Surplus | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const s = await surplusesApi.get(surplusId);
      setSurplus(s);

      const [mat, specs] = await Promise.all([
        materialsApi.get(s.material_id),
        specificationsApi.listByMaterial(s.material_id),
      ]);
      setMaterial(mat);
      setSpecifications(specs);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo cargar el excedente");
    } finally {
      setIsLoading(false);
    }
  }, [surplusId]);

  useEffect(() => {
    if (Number.isFinite(surplusId)) load();
  }, [surplusId, load]);

  const handleChangeStatus = async (status: SurplusStatus) => {
    const updated = await surplusesApi.changeStatus(surplusId, status);
    setSurplus(updated);
  };

  const handleDelete = async () => {
    await surplusesApi.deactivate(surplusId);
    router.push("/excedentes");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !surplus) {
    return (
      <div className="space-y-6">
        <Link
          href="/excedentes"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-6 dark:bg-danger-500/10">
          <p className="text-sm text-danger-700 dark:text-danger-500">
            {error ?? "Excedente no encontrado"}
          </p>
        </div>
      </div>
    );
  }

  const canEdit = surplus.status !== "sold";

  return (
    <div className="space-y-6">
      <Link
        href="/excedentes"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mis excedentes
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-neutral-400" />
                  <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {material?.name ?? `Material #${surplus.material_id}`}
                  </h1>
                </div>
                {material && (
                  <p className="mt-1 text-sm text-neutral-500">
                    {material.category}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge entity="surplus" status={surplus.status} />
                {canEdit && (
                  <Link href={`/excedentes/${surplus.id}/editar`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                  </Link>
                )}
                <SurplusActions
                  surplus={surplus}
                  onChangeStatus={handleChangeStatus}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </div>

          {surplus.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                  {surplus.description}
                </p>
              </CardContent>
            </Card>
          )}

          {specifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Especificaciones técnicas</CardTitle>
              </CardHeader>
              <CardContent>
                <SpecList
                  specifications={specifications}
                  values={surplus.specifications}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                  Cantidad
                </p>
                <p className="mt-1 font-mono text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                  {formatQuantity(surplus.quantity, surplus.unit)}
                </p>
              </div>

              <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                  Precio unitario
                </p>
                <p className="mt-1 font-mono text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(surplus.unit_price)}
                  <span className="ml-1 text-sm text-neutral-500">
                    /{surplus.unit}
                  </span>
                </p>
              </div>

              <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                  Total estimado
                </p>
                <p className="mt-1 font-mono text-xl text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(
                    parseFloat(surplus.quantity) *
                      parseFloat(surplus.unit_price)
                  )}
                </p>
              </div>

              <p className="border-t border-neutral-100 pt-4 text-center text-xs text-neutral-400 dark:border-neutral-800">
                Publicado {formatRelativeTime(surplus.created_at)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <MatchesSection resourceId={surplus.id} direction="surplus" limit={6} />
      <ValuationSection surplusId={surplus.id} limit={20} />
    </div>
  );
}