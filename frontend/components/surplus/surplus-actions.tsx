"use client";

import { Ban, CheckCircle2, MoreVertical, PackageCheck, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Surplus, SurplusStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SurplusActionsProps {
  surplus: Surplus;
  onChangeStatus: (status: SurplusStatus) => Promise<void>;
  onDelete: () => Promise<void>;
}

const TRANSITIONS: Record<SurplusStatus, { to: SurplusStatus; label: string; icon: typeof CheckCircle2 }[]> = {
  available: [
    { to: "reserved", label: "Marcar como reservado", icon: PackageCheck },
    { to: "inactive", label: "Desactivar", icon: Ban },
  ],
  reserved: [
    { to: "sold", label: "Marcar como vendido", icon: PackageCheck },
    { to: "available", label: "Liberar (disponible)", icon: CheckCircle2 },
    { to: "inactive", label: "Desactivar", icon: Ban },
  ],
  sold: [],
  inactive: [
    { to: "available", label: "Reactivar", icon: CheckCircle2 },
  ],
};

export function SurplusActions({
  surplus,
  onChangeStatus,
  onDelete,
}: SurplusActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  const handle = async (fn: () => Promise<void>) => {
    setOpen(false);
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  const transitions = TRANSITIONS[surplus.status] ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Acciones"
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors",
          "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
          "dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
          "disabled:opacity-50"
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {transitions.length === 0 && (
            <p className="px-3 py-2 text-xs text-neutral-500">
              No hay acciones disponibles
            </p>
          )}

          {transitions.map(({ to, label, icon: Icon }) => (
            <button
              key={to}
              type="button"
              onClick={() => handle(() => onChangeStatus(to))}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}

          <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "¿Desactivar este excedente? Ya no aparecerá en el marketplace."
                )
              ) {
                handle(onDelete);
              }
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Desactivar
          </button>
        </div>
      )}
    </div>
  );
}