"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { MaterialForm } from "@/components/material/material-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, materialsApi, type Material } from "@/lib/api";

export default function EditMaterialPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const materialId = Number(params.id);

  const [material, setMaterial] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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

  const handleSubmit = async (values: {
    name: string;
    category: string;
    description?: string | null;
  }) => {
    await materialsApi.update(materialId, values);
    router.push(`/materiales/${materialId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !material) {
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

  return (
    <div className="space-y-6">
      <Link
        href={`/materiales/${materialId}`}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Editar material
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <MaterialForm
            material={material}
            onSubmit={handleSubmit}
            submitLabel="Guardar cambios"
            onCancel={() => router.push(`/materiales/${materialId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}