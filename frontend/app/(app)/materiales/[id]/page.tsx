"use client";

import { ArrowLeft, Layers, Pencil } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { MaterialActions } from "@/components/material/material-actions";
import { SpecificationsSection } from "@/components/material/specifications-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, materialsApi, type Material } from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";
import { formatRelativeTime } from "@/lib/format";

export default function MaterialDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const materialId = Number(params.id);

  const [material, setMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const m = await materialsApi.get(materialId);
      setMaterial(m);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo cargar el material");
    } finally {
      setIsLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    if (Number.isFinite(materialId)) load();
  }, [materialId, load]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !material || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/materiales"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-6 dark:bg-danger-500/10">
          <p className="text-sm text-danger-700 dark:text-danger-500">
            {error ?? "Material no encontrado"}
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "platform_admin";
  const isProposer =
    material.status === "pending" &&
    material.proposed_by_company_id === user.company_id;
  const canEdit = isAdmin || isProposer;

  return (
    <div className="space-y-6">
      <Link
        href="/materiales"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a materiales
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-neutral-400" />
                  <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {material.name}
                  </h1>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {material.category}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge entity="material" status={material.status} />
                {canEdit && (
                  <Link href={`/materiales/${material.id}/editar`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {material.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                  {material.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <SpecificationsSection material={material} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
        {isAdmin && (
        <Card>
            <CardContent className="space-y-3 pt-6">
            <MaterialActions
                material={material}
                onUpdated={setMaterial}
                onDeleted={() => router.push("/materiales")}
            />
            </CardContent>
        </Card>
        )}
          <Card>
            <CardContent className="pt-6">
              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-500">Creado</dt>
                  <dd className="font-mono text-neutral-700 dark:text-neutral-300">
                    {formatRelativeTime(material.created_at)}
                  </dd>
                </div>
                {material.proposed_by_company_id !== null && (
                  <div className="flex items-center justify-between">
                    <dt className="text-neutral-500">Propuesto por</dt>
                    <dd className="font-mono text-neutral-700 dark:text-neutral-300">
                      Empresa #{material.proposed_by_company_id}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}