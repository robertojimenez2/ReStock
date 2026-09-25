"use client";

import { Archive, Check, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ApiError, materialsApi, type Material } from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";

interface MaterialActionsProps {
  material: Material;
  onUpdated: (material: Material) => void;
  onDeleted?: () => void;
}

export function MaterialActions({
  material,
  onUpdated,
  onDeleted,
}: MaterialActionsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === "platform_admin";
  const isPending = material.status === "pending";

  const run = async (key: string, fn: () => Promise<void>) => {
    setLoading(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("Acción fallida");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {isAdmin && isPending && (
          <>
            <Button
              className="w-full"
              loading={loading === "approve"}
              onClick={() =>
                run("approve", async () => {
                  const updated = await materialsApi.approve(material.id);
                  onUpdated(updated);
                })
              }
            >
              <Check className="h-4 w-4" />
              Aprobar
            </Button>

            <Button
              variant="outline"
              className="w-full text-danger-500"
              loading={loading === "reject"}
              onClick={() =>
                run("reject", async () => {
                  const updated = await materialsApi.reject(material.id);
                  onUpdated(updated);
                })
              }
            >
              <X className="h-4 w-4" />
              Rechazar
            </Button>
          </>
        )}

        {isAdmin && (
          <Button
            variant="outline"
            className="w-full text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10"
            onClick={() => setConfirmDelete(true)}
          >
            <Archive className="h-4 w-4" />
            Eliminar material
          </Button>
        )}

        {error && (
          <div className="rounded-md border border-danger-500/20 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-500">
            {error}
          </div>
        )}
      </div>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Eliminar material"
        description="Esta acción es permanente. Falla si el material tiene excedentes o necesidades asociadas."
        size="sm"
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setConfirmDelete(false)}
            disabled={loading === "delete"}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            loading={loading === "delete"}
            onClick={async () => {
              await run("delete", async () => {
                await materialsApi.delete(material.id);
                onDeleted?.();
              });
              setConfirmDelete(false);
            }}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>
    </>
  );
}