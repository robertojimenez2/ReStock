"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { SurplusForm } from "@/components/surplus/surplus-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  materialsApi,
  surplusesApi,
  type Material,
  type Surplus,
} from "@/lib/api";

export default function EditSurplusPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const surplusId = Number(params.id);

  const [surplus, setSurplus] = useState<Surplus | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, mats] = await Promise.all([
        surplusesApi.get(surplusId),
        materialsApi.list({ limit: 200 }),
      ]);
      setSurplus(s);
      setMaterials(mats.filter((m) => m.status === "active"));
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

  const handleSubmit = async (payload: Parameters<typeof surplusesApi.update>[1]) => {
    await surplusesApi.update(surplusId, {
      quantity: payload.quantity,
      unit: payload.unit,
      unit_price: payload.unit_price,
      description: payload.description,
      specifications: payload.specifications,
    });
    router.push(`/excedentes/${surplusId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-lg" />
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

  if (surplus.status === "sold") {
    return (
      <div className="space-y-6">
        <Link
          href={`/excedentes/${surplusId}`}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div className="rounded-lg border border-accent-500/30 bg-accent-50 p-6 dark:bg-accent-500/10">
          <p className="text-sm text-accent-900 dark:text-accent-500">
            No puedes editar un excedente vendido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/excedentes/${surplusId}`}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Editar excedente
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Actualiza los datos del excedente. El material no se puede cambiar.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <SurplusForm
            surplus={surplus}
            materials={materials}
            onSubmit={handleSubmit}
            submitLabel="Guardar cambios"
            onCancel={() => router.push(`/excedentes/${surplusId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}