"use client";

import { Plus, Settings2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { SpecificationFormDialog } from "./specification-form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  specificationsApi,
  type Material,
  type Specification,
} from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";

interface SpecificationsSectionProps {
  material: Material;
}

const DATA_TYPE_LABELS: Record<string, string> = {
  number: "Numérico",
  text: "Texto",
  boolean: "Booleano",
};

export function SpecificationsSection({ material }: SpecificationsSectionProps) {
  const { user } = useAuth();
  const [specs, setSpecs] = useState<Specification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Specification | undefined>(undefined);
  const [deleting, setDeleting] = useState<Specification | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await specificationsApi.listByMaterial(material.id);
      setSpecs(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudieron cargar las especificaciones");
    } finally {
      setIsLoading(false);
    }
  }, [material.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Reglas de edición
  const isAdmin = user?.role === "platform_admin";
  const isProposer =
    material.status === "pending" &&
    material.proposed_by_company_id === user?.company_id;
  const canManage = isAdmin || isProposer;

  const handleSaved = (saved: Specification) => {
    setSpecs((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await specificationsApi.delete(material.id, deleting.id);
      setSpecs((prev) => prev.filter((s) => s.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      if (err instanceof ApiError) setDeleteError(err.detail);
      else setDeleteError("No se pudo eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-neutral-400" />
          <h2 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
            Especificaciones técnicas
          </h2>
        </div>
        {canManage && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir
          </Button>
        )}
      </div>

      {error ? (
        <div className="rounded-md border border-danger-500/30 bg-danger-50 p-4 dark:bg-danger-500/10">
          <p className="text-sm text-danger-700 dark:text-danger-500">
            {error}
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : specs.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            {canManage
              ? "Aún no hay especificaciones. Añade la primera."
              : "Este material no tiene especificaciones definidas."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700/50">
          <table className="w-full">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left dark:border-neutral-700/50 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Nombre
                </th>
                <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Tipo
                </th>
                <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Unidad
                </th>
                <th className="px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Requerida
                </th>
                {canManage && <th className="w-12"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {specs.map((spec) => (
                <tr
                  key={spec.id}
                  className="bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {spec.name}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {DATA_TYPE_LABELS[spec.data_type]}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                    {spec.unit ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {spec.is_required ? "Sí" : "No"}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(spec);
                            setDialogOpen(true);
                          }}
                          className="rounded p-1 text-xs text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleting(spec);
                            setDeleteError(null);
                          }}
                          className="rounded p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Crear / editar */}
      <SpecificationFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(undefined);
        }}
        materialId={material.id}
        specification={editing}
        disableDataTypeChange={isAdmin && editing !== undefined}
        onSaved={handleSaved}
      />

      {/* Eliminar */}
      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Eliminar especificación"
        description={
          deleting
            ? `¿Eliminar "${deleting.name}"? Falla si tiene valores asociados.`
            : ""
        }
        size="sm"
      >
        {deleteError && (
          <div className="mb-4 rounded-md border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
            {deleteError}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setDeleting(null)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={isDeleting}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}