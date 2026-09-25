"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ApiError,
  specificationsApi,
  type Specification,
  type SpecificationDataType,
} from "@/lib/api";

const DATA_TYPE_OPTIONS = [
  { value: "number", label: "Numérico" },
  { value: "text", label: "Texto" },
  { value: "boolean", label: "Booleano" },
];

interface SpecificationFormDialogProps {
  open: boolean;
  onClose: () => void;
  materialId: number;
  /** Si viene, edita. Si no, crea. */
  specification?: Specification;
  /** Si el material tiene specs con valores, no se puede cambiar data_type. */
  disableDataTypeChange?: boolean;
  onSaved: (spec: Specification) => void;
}

export function SpecificationFormDialog({
  open,
  onClose,
  materialId,
  specification,
  disableDataTypeChange = false,
  onSaved,
}: SpecificationFormDialogProps) {
  const isEdit = specification !== undefined;

  const [name, setName] = useState(specification?.name ?? "");
  const [dataType, setDataType] = useState<SpecificationDataType>(
    specification?.data_type ?? "number"
  );
  const [unit, setUnit] = useState(specification?.unit ?? "");
  const [description, setDescription] = useState(
    specification?.description ?? ""
  );
  const [isRequired, setIsRequired] = useState(
    specification?.is_required ?? false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reiniciar al abrir
  useEffect(() => {
    if (!open) return;
    setName(specification?.name ?? "");
    setDataType(specification?.data_type ?? "number");
    setUnit(specification?.unit ?? "");
    setDescription(specification?.description ?? "");
    setIsRequired(specification?.is_required ?? false);
    setError(null);
  }, [open, specification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        data_type: dataType,
        unit: unit || null,
        description: description || null,
        is_required: isRequired,
      };

      const saved = isEdit
        ? await specificationsApi.update(materialId, specification.id, payload)
        : await specificationsApi.create(materialId, payload);

      onSaved(saved);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo guardar la especificación");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar especificación" : "Nueva especificación"}
      description="Define una característica técnica del material."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          placeholder="Índice de fluidez"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Select
          label="Tipo de dato"
          value={dataType}
          options={DATA_TYPE_OPTIONS}
          onChange={(e) => setDataType(e.target.value as SpecificationDataType)}
          disabled={disableDataTypeChange}
          hint={
            disableDataTypeChange
              ? "No se puede cambiar: hay valores asociados"
              : undefined
          }
          required
        />

        <Input
          label="Unidad (opcional)"
          placeholder="g/10min"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />

        <Input
          label="Descripción (opcional)"
          placeholder="Medida de fluidez del polímero"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500 dark:border-neutral-700"
          />
          Requerida al publicar excedentes o necesidades
        </label>

        {error && (
          <div className="rounded-md border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Guardar cambios" : "Crear"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}