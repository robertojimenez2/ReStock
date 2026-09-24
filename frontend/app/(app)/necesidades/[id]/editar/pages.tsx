"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { NeedForm } from "@/components/need/need-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  materialsApi,
  needsApi,
  type Material,
  type Need,
} from "@/lib/api";

export default function EditNeedPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const needId = Number(params.id);

  const [need, setNeed] = useState<Need | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [n, mats] = await Promise.all([
        needsApi.get(needId),
        materialsApi.list({ limit: 200 }),
      ]);
      setNeed(n);
      setMaterials(mats.filter((m) => m.status === "active"));
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

  const handleSubmit = async (
    payload: Parameters<typeof needsApi.update>[1]
  ) => {
    await needsApi.update(needId, {
      quantity: payload.quantity,
      unit: payload.unit,
      max_price: payload.max_price,
      description: payload.description,
      specifications: payload.specifications,
    });
    router.push(`/necesidades/${needId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-lg" />
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

  if (need.status === "fulfilled") {
    return (
      <div className="space-y-6">
        <Link
          href={`/necesidades/${needId}`}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div className="rounded-lg border border-accent-500/30 bg-accent-50 p-6 dark:bg-accent-500/10">
          <p className="text-sm text-accent-900 dark:text-accent-500">
            No puedes editar una necesidad cumplida.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/necesidades/${needId}`}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Editar necesidad
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Actualiza los datos. El material no se puede cambiar.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <NeedForm
            need={need}
            materials={materials}
            onSubmit={handleSubmit}
            submitLabel="Guardar cambios"
            onCancel={() => router.push(`/necesidades/${needId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}