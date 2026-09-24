"use client";

import { ArrowLeft, Pencil, Target } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { NeedActions } from "@/components/need/need-actions";
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
  needsApi,
  specificationsApi,
  type Material,
  type Need,
  type NeedStatus,
  type Specification,
} from "@/lib/api";
import { formatCurrency, formatQuantity, formatRelativeTime } from "@/lib/format";

export default function NeedDetailPage() {
  const params = useParams<{ id: string }>();
  const needId = Number(params.id);

  const [need, setNeed] = useState<Need | null>(null);
  const [material, setMaterial] = useState<Material | null>(null);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const n = await needsApi.get(needId);
      setNeed(n);

      const [mat, specs] = await Promise.all([
        materialsApi.get(n.material_id),
        specificationsApi.listByMaterial(n.material_id),
      ]);
      setMaterial(mat);
      setSpecifications(specs);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo cargar la necesidad");
    } finally {
      setIsLoading(false);
    }
  }, [needId]);

  useEffect(() => {
    if (Number.isFinite(needId)) load();
  }, [needId, load]);

  const handleChangeStatus = async (status: NeedStatus) => {
    const updated = await needsApi.changeStatus(needId, status);
    setNeed(updated);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !need) {
    return (
      <div className="space-y-6">
        <Link
          href="/necesidades"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-6 dark:bg-danger-500/10">
          <p className="text-sm text-danger-700 dark:text-danger-500">
            {error ?? "Necesidad no encontrada"}
          </p>
        </div>
      </div>
    );
  }

  const canEdit = need.status !== "fulfilled";

  return (
    <div className="space-y-6">
      <Link
        href="/necesidades"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mis necesidades
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-neutral-400" />
                  <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {material?.name ?? `Material #${need.material_id}`}
                  </h1>
                </div>
                {material && (
                  <p className="mt-1 text-sm text-neutral-500">
                    {material.category}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge entity="need" status={need.status} />
                {canEdit && (
                  <Link href={`/necesidades/${need.id}/editar`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                  </Link>
                )}
                <NeedActions need={need} onChangeStatus={handleChangeStatus} />
              </div>
            </div>
          </div>

          {need.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                  {need.description}
                </p>
              </CardContent>
            </Card>
          )}

          {specifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requisitos técnicos</CardTitle>
              </CardHeader>
              <CardContent>
                <NeedSpecList
                  specifications={specifications}
                  values={need.specifications}
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
                  Cantidad requerida
                </p>
                <p className="mt-1 font-mono text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                  {formatQuantity(need.quantity, need.unit)}
                </p>
              </div>

              <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                  Presupuesto máximo
                </p>
                {need.max_price ? (
                  <p className="mt-1 font-mono text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                    {formatCurrency(need.max_price)}
                    <span className="ml-1 text-sm text-neutral-500">
                      /{need.unit}
                    </span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-neutral-500 italic">
                    Sin techo definido
                  </p>
                )}
              </div>

              <p className="border-t border-neutral-100 pt-4 text-center text-xs text-neutral-400 dark:border-neutral-800">
                Publicada {formatRelativeTime(need.created_at)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── SpecList específico para Need (rangos) ──────────────────────────
function NeedSpecList({
  specifications,
  values,
}: {
  specifications: Specification[];
  values: Need["specifications"];
}) {
  const valuesBySpecId = new Map(values.map((v) => [v.specification_id, v]));

  return (
    <dl className="space-y-2">
      {specifications.map((spec) => {
        const value = valuesBySpecId.get(spec.id);
        const display = formatNeedValue(spec, value);

        return (
          <div
            key={spec.id}
            className="flex items-baseline justify-between gap-4 border-b border-neutral-100 pb-2 last:border-0 dark:border-neutral-800"
          >
            <dt className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              {spec.name}
              {spec.unit && (
                <span className="text-xs text-neutral-400">
                  ({spec.unit})
                </span>
              )}
            </dt>
            <dd className="font-mono text-sm text-neutral-900 dark:text-neutral-100">
              {display ?? (
                <span className="text-neutral-400">Sin especificar</span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function formatNeedValue(
  spec: Specification,
  value:
    | {
        value_number: string | null;
        min_value_number: string | null;
        max_value_number: string | null;
        value_text: string | null;
        value_boolean: boolean | null;
      }
    | undefined
): string | null {
  if (!value) return null;

  if (spec.data_type === "number") {
    if (value.value_number !== null) return value.value_number;

    const min = value.min_value_number;
    const max = value.max_value_number;
    if (min !== null && max !== null) return `${min} – ${max}`;
    if (min !== null) return `≥ ${min}`;
    if (max !== null) return `≤ ${max}`;
    return null;
  }

  if (spec.data_type === "text" && value.value_text !== null) {
    return value.value_text;
  }

  if (spec.data_type === "boolean" && value.value_boolean !== null) {
    return value.value_boolean ? "Sí" : "No";
  }

  return null;
}