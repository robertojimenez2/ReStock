"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { SpecInputsGroup } from "./spec-inputs-group";
import type { SpecValue } from "./spec-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ApiError,
  materialsApi,
  specificationsApi,
  type Material,
  type Specification,
  type Surplus,
  type SurplusCreatePayload,
  type SurplusSpecificationInput,
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
  unit_price: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
      message: "Debe ser mayor o igual a 0",
    }),
  description: z.string().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface SurplusFormProps {
  /** Si viene, es modo edición. Si no, es creación. */
  surplus?: Surplus;
  /** Materiales activos cargados desde el padre. */
  materials: Material[];
  onSubmit: (payload: SurplusCreatePayload) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export function SurplusForm({
  surplus,
  materials,
  onSubmit,
  submitLabel = "Guardar",
  onCancel,
}: SurplusFormProps) {
  const isEdit = surplus !== undefined;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      material_id: surplus?.material_id ? String(surplus.material_id) : "",
      quantity: surplus?.quantity ?? "",
      unit: surplus?.unit ?? "kg",
      unit_price: surplus?.unit_price ?? "",
      description: surplus?.description ?? "",
    },
  });

  const materialId = watch("material_id");

  // ── Specs del material seleccionado ─────────────────────────────
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [specValues, setSpecValues] = useState<Record<number, SpecValue>>({});
  const [specErrors, setSpecErrors] = useState<Record<number, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Cargar specs cuando cambia el material (solo en modo creación;
  // en edición el material es fijo y las specs se cargan al montar).
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

        // Inicializar valores
        const initial: Record<number, SpecValue> = {};
        for (const spec of specs) {
          // En edición, buscar valor existente en surplus.specifications
          const existing = surplus?.specifications.find(
            (s) => s.specification_id === spec.id
          );

          initial[spec.id] = {
            specification_id: spec.id,
            value_number:
              existing?.value_number ?? "",
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
  }, [materialId, surplus]);

  const updateSpecValue = (
    specificationId: number,
    patch: Partial<SpecValue>
  ) => {
    setSpecValues((prev) => ({
      ...prev,
      [specificationId]: { ...prev[specificationId], ...patch },
    }));
    // Limpiar error de esa spec al escribir
    setSpecErrors((prev) => {
      if (!prev[specificationId]) return prev;
      const next = { ...prev };
      delete next[specificationId];
      return next;
    });
  };

  const buildSpecInputs = useMemo(() => {
    return (): SurplusSpecificationInput[] => {
      const inputs: SurplusSpecificationInput[] = [];
      const newErrors: Record<number, string> = {};

      for (const spec of specifications) {
        const value = specValues[spec.id];
        if (!value) continue;

        const hasValue =
          value.value_number !== "" ||
          value.value_text !== "" ||
          value.value_boolean !== "";

        if (spec.is_required && !hasValue) {
          newErrors[spec.id] = "Requerido";
          continue;
        }

        if (!hasValue) continue;

        const input: SurplusSpecificationInput = {
          specification_id: spec.id,
        };

        if (spec.data_type === "number") {
          input.value_number = value.value_number;
        } else if (spec.data_type === "text") {
          input.value_text = value.value_text;
        } else {
          input.value_boolean = value.value_boolean === "true";
        }

        inputs.push(input);
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

    let specs: SurplusSpecificationInput[];
    try {
      specs = buildSpecInputs();
    } catch {
      // El usuario tiene errores en specs; no seguimos
      return;
    }

    const payload: SurplusCreatePayload = {
      material_id: Number(values.material_id),
      quantity: values.quantity,
      unit: values.unit,
      unit_price: values.unit_price,
      description: values.description || null,
      specifications: specs,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError) {
        // Intentar mapear el error del backend a la spec correspondiente
        if (err.detail.toLowerCase().includes("especificaci")) {
          setServerError(err.detail);
        } else if (err.isConflict) {
          setServerError(err.detail);
        } else {
          setServerError(err.detail);
        }
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
      {/* Material (bloqueado en edición) */}
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
          placeholder="5000"
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
          label="Precio unitario (MXN)"
          type="number"
          step="any"
          placeholder="15.50"
          error={errors.unit_price?.message}
          {...register("unit_price")}
        />
      </div>

      <Input
        label="Descripción"
        placeholder="PEBD natural en pellet, disponible para entrega inmediata"
        error={errors.description?.message}
        {...register("description")}
      />

      {/* Specs dinámicas */}
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