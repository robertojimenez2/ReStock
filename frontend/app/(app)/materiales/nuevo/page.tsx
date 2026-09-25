"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MaterialForm } from "@/components/material/material-form";
import { Card, CardContent } from "@/components/ui/card";
import { materialsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";

export default function NewMaterialPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "platform_admin";

  const handleSubmit = async (values: {
    name: string;
    category: string;
    description?: string | null;
  }) => {
    const created = await materialsApi.create(values);
    router.push(`/materiales/${created.id}`);
  };

  return (
    <div className="space-y-6">
      <Link
        href="/materiales"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {isAdmin ? "Nuevo material" : "Proponer material"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {isAdmin
            ? "El material estará disponible inmediatamente en el catálogo."
            : "Tu propuesta será revisada por un administrador antes de publicarse."}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <MaterialForm
            onSubmit={handleSubmit}
            submitLabel={isAdmin ? "Crear material" : "Enviar propuesta"}
            onCancel={() => router.push("/materiales")}
          />
        </CardContent>
      </Card>
    </div>
  );
}