"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, type Material } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(150),
  category: z.string().min(2, "Mínimo 2 caracteres").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface MaterialFormProps {
  material?: Material;
  onSubmit: (values: {
    name: string;
    category: string;
    description?: string | null;
  }) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export function MaterialForm({
  material,
  onSubmit,
  submitLabel = "Guardar",
  onCancel,
}: MaterialFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: material?.name ?? "",
      category: material?.category ?? "",
      description: material?.description ?? "",
    },
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const handleFormSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await onSubmit({
        name: values.name,
        category: values.category,
        description: values.description || null,
      });
    } catch (err) {
      if (err instanceof ApiError) setServerError(err.detail);
      else setServerError("No se pudo guardar");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Nombre"
        placeholder="PEBD"
        hint="Usa nombres técnicos estándar"
        error={errors.name?.message}
        {...register("name")}
      />

      <Input
        label="Categoría"
        placeholder="Plásticos"
        error={errors.category?.message}
        {...register("category")}
      />

      <Input
        label="Descripción"
        placeholder="Polietileno de baja densidad"
        error={errors.description?.message}
        {...register("description")}
      />

      {serverError && (
        <div className="rounded-md border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
          {serverError}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}