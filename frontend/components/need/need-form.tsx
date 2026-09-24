"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SpecInputsGroup } from "./spect-inputs-group";
import type { NeedSpecValue } from "./spec-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ApiError,
  materialsApi,
  specificationsApi,
  type Material,
  type Need,
  type NeedCreatePayload,
  type NeedSpecificationInput,
  type Specification,
} from "@/lib/api";

const UNIT_OPTIONS = [
  { value: "kg", label: "Kilogramos (kg)" },
  { value: "ton", label: "Toneladas (ton)" },
  { value: "pieza", label: "Piezas" },
  { value: "m", label: "Metros (m)" },
  { value: "m2", label: "Metros cuadrados (m²)" },
  { value: "l", label: "Litros (l)" },
];

const schema = z.object({
  material_id: z.string().min(1, "Selecciona un material"),
  quantity: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Debe ser mayor a 0",
    }),
  unit: z.string().min(1, "Requerido"),
  max_price: z
    .string()
    .refine(
      (v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0),
      { message: "Debe ser mayor o igual a 0" }
    )
    .optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface NeedFormProps {
  need?: Need;
  materials: Material[];
  onSubmit: (payload: NeedCreatePayload) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export function NeedForm({
  need,
  materials,
  onSubmit,
  submitLabel = "Guardar",
  onCancel,
}: NeedFormProps) {
  const isEdit = need !== undefined;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      material_id: need?.material_id ? String(need.material_id) : "",
      quantity: need?.quantity ?? "",
      unit: need?.unit ?? "kg",
      max_price: need?.max_price ?? "",
      description: need?.description ?? "",
    },
  });

  const materialId = watch("material_id");

  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [specValues, setSpecValues] = useState<Record<number, NeedSpecValue>>(
    {}
  );
  const [specErrors, setSpecErrors] = useState<Record<number, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const mid = Number(materialId);
    if (!mid || !Number.isFinite(mid)) {
      setSpecifications([]);
      return;
    }

    setIsLoadingSpecs(true);
    specificationsApi
      .listByMaterial(mid)
      .then((specs) => {
        setSpecifications(specs);

        const initial: Record<number, NeedSpecValue> = {};
        for (const spec of specs) {
          const existing = need?.specifications.find(
            (s) => s.specification_id === spec.id
          );

          const hasRange =
            existing?.min_value_number != null ||
            existing?.max_value_number != null;

          initial[spec.id] = {
            specification_id: spec.id,
            mode: hasRange ? "range" : "exact",
            value_number: existing?.value_number ?? "",
            min_value_number: existing?.min_value_number ?? "",
            max_value_number: existing?.max_value_number ?? "",
            value_text: existing?.value_text ?? "",
            value_boolean:
              existing?.value_boolean === null ||
              existing?.value_boolean === undefined
                ? ""
                : existing.value_boolean
                  ? "true"
                  : "false",
          };
        }
        setSpecValues(initial);
      })
      .catch(() => setSpecifications([]))
      .finally(() => setIsLoadingSpecs(false));
  }, [materialId, need]);

  const updateSpecValue = (
    specificationId: number,
    patch: Partial<NeedSpecValue>
  ) => {
    setSpecValues((prev) => ({
      ...prev,
      [specificationId]: { ...prev[specificationId], ...patch },
    }));
    setSpecErrors((prev) => {
      if (!prev[specificationId]) return prev;
      const next = { ...prev };
      delete next[specificationId];
      return next;
    });
  };

  const buildSpecInputs = useMemo(() => {
    return (): NeedSpecificationInput[] => {
      const inputs: NeedSpecificationInput[] = [];
      const newErrors: Record<number, string> = {};

      for (const spec of specifications) {
        const value = specValues[spec.id];
        if (!value) continue;

        if (spec.data_type === "number") {
          if (value.mode === "exact") {
            const hasValue = value.value_number !== "";
            if (spec.is_required && !hasValue) {
              newErrors[spec.id] = "Requerido";
              continue;
            }
            if (!hasValue) continue;

            inputs.push({
              specification_id: spec.id,
              value_number: value.value_number,
            });
          } else {
            const hasMin = value.min_value_number !== "";
            const hasMax = value.max_value_number !== "";

            if (spec.is_required && !hasMin && !hasMax) {
              newErrors[spec.id] = "Define al menos un extremo del rango";
              continue;
            }
            if (!hasMin && !hasMax) continue;

            if (hasMin && hasMax) {
              const min = parseFloat(value.min_value_number);
              const max = parseFloat(value.max_value_number);
              if (min > max) {
                newErrors[spec.id] = "El mínimo no puede ser mayor al máximo";
                continue;
              }
            }

            inputs.push({
              specification_id: spec.id,
              min_value_number: hasMin ? value.min_value_number : null,
              max_value_number: hasMax ? value.max_value_number : null,
            });
          }
        } else if (spec.data_type === "text") {
          const hasValue = value.value_text !== "";
          if (spec.is_required && !hasValue) {
            newErrors[spec.id] = "Requerido";
            continue;
          }
          if (!hasValue) continue;

          inputs.push({
            specification_id: spec.id,
            value_text: value.value_text,
          });
        } else {
          const hasValue = value.value_boolean !== "";
          if (spec.is_required && !hasValue) {
            newErrors[spec.id] = "Requerido";
            continue;
          }
          if (!hasValue) continue;

          inputs.push({
            specification_id: spec.id,
            value_boolean: value.value_boolean === "true",
          });
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setSpecErrors(newErrors);
        throw new Error("spec-validation");
      }

      return inputs;
    };
  }, [specifications, specValues]);

  const handleFormSubmit = async (values: FormValues) => {
    setServerError(null);
    setSpecErrors({});

    let specs: NeedSpecificationInput[];
    try {
      specs = buildSpecInputs();
    } catch {
      return;
    }

    const payload: NeedCreatePayload = {
      material_id: Number(values.material_id),
      quantity: values.quantity,
      unit: values.unit,
      max_price: values.max_price || null,
      description: values.description || null,
      specifications: specs,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.detail);
      } else {
        setServerError("No se pudo guardar");
      }
    }
  };

  const materialOptions = materials.map((m) => ({
    value: String(m.id),
    label: `${m.name} — ${m.category}`,
  }));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label="Material"
          value={materialId}
          placeholder="Selecciona un material"
          options={materialOptions}
          error={errors.material_id?.message}
          disabled={isEdit}
          {...register("material_id")}
        />

        <Input
          label="Cantidad"
          type="number"
          step="any"
          placeholder="3000"
          error={errors.quantity?.message}
          {...register("quantity")}
        />

        <Select
          label="Unidad"
          value={watch("unit")}
          options={UNIT_OPTIONS}
          error={errors.unit?.message}
          {...register("unit")}
        />

        <Input
          label="Precio máximo (MXN)"
          type="number"
          step="any"
          placeholder="Dejar vacío para cualquier precio"
          hint="Opcional. Define tu techo de presupuesto."
          error={errors.max_price?.message}
          {...register("max_price")}
        />
      </div>

      <Input
        label="Descripción"
        placeholder="Necesito PEBD natural en pellet para inyección"
        error={errors.description?.message}
        {...register("description")}
      />

      {materialId && (
        <>
          {isLoadingSpecs ? (
            <p className="text-sm text-neutral-500">
              Cargando especificaciones...
            </p>
          ) : (
            <SpecInputsGroup
              specifications={specifications}
              values={specValues}
              errors={specErrors}
              onChange={updateSpecValue}
            />
          )}
        </>
      )}

      {serverError && (
        <div className="rounded-md border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
          {serverError}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
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