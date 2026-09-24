"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SurplusForm } from "@/components/surplus/surplus-form";
import { Card, CardContent } from "@/components/ui/card";
import { materialsApi, surplusesApi, type Material } from "@/lib/api";

export default function NewSurplusPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    materialsApi
      .list({ limit: 200 })
      .then((data) => setMaterials(data.filter((m) => m.status === "active")))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (payload: Parameters<typeof surplusesApi.create>[0]) => {
    const created = await surplusesApi.create(payload);
    router.push(`/excedentes/${created.id}`);
  };

  return (
    <div className="space-y-6">
      <Link
        href="/excedentes"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Nuevo excedente
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Publica un excedente para que otras empresas puedan encontrarlo.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-sm text-neutral-500">Cargando materiales...</p>
          ) : materials.length === 0 ? (
            <div className="rounded-md bg-accent-50 p-4 text-sm text-accent-900 dark:bg-accent-500/10 dark:text-accent-500">
              No hay materiales activos en el catálogo. Propón uno desde
              Materiales.
            </div>
          ) : (
            <SurplusForm
              materials={materials}
              onSubmit={handleSubmit}
              submitLabel="Publicar excedente"
              onCancel={() => router.push("/excedentes")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}