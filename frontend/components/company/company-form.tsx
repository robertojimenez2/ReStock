"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, type Company } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(150),
  legal_name: z.string().min(2, "Mínimo 2 caracteres").max(150),
  industry: z.string().min(2, "Mínimo 2 caracteres").max(100),
  description: z.string().max(250).optional().or(z.literal("")),
  city: z.string().min(2, "Mínimo 2 caracteres").max(100),
  state: z.string().min(2, "Mínimo 2 caracteres").max(100),
  address: z.string().max(250).optional().or(z.literal("")),
});

export type CompanyFormValues = z.infer<typeof schema>;

interface CompanyFormProps {
  company: Company;
  onSubmit: (values: CompanyFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function CompanyForm({
  company,
  onSubmit,
  onCancel,
  submitLabel = "Guardar cambios",
}: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: company.name,
      legal_name: company.legal_name,
      industry: company.industry,
      description: company.description ?? "",
      city: company.city,
      state: company.state,
      address: company.address ?? "",
    },
  });

  const [serverError, setServerError] = useState<string | null>(null);

  const handleFormSubmit = async (values: CompanyFormValues) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiError) setServerError(err.detail);
      else setServerError("No se pudo guardar");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Información comercial
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Nombre comercial"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Razón social"
            error={errors.legal_name?.message}
            {...register("legal_name")}
          />
        </div>

        <Input
          label="Industria"
          error={errors.industry?.message}
          {...register("industry")}
        />

        <Input
          label="Descripción"
          placeholder="Breve descripción de la empresa"
          error={errors.description?.message}
          {...register("description")}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Ubicación
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Ciudad"
            error={errors.city?.message}
            {...register("city")}
          />
          <Input
            label="Estado"
            error={errors.state?.message}
            {...register("state")}
          />
        </div>

        <Input
          label="Dirección"
          placeholder="Av. Industrial 123"
          error={errors.address?.message}
          {...register("address")}
        />
      </section>

      {serverError && (
        <div className="rounded-md border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
          {serverError}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
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