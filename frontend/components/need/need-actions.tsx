"use client";

import { Archive, CheckCircle2, MoreVertical, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Need, NeedStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NeedActionsProps {
  need: Need;
  onChangeStatus: (status: NeedStatus) => Promise<void>;
}

const TRANSITIONS: Record<
  NeedStatus,
  { to: NeedStatus; label: string; icon: typeof CheckCircle2 }[]
> = {
  active: [
    { to: "fulfilled", label: "Marcar como cumplida", icon: CheckCircle2 },
    { to: "inactive", label: "Desactivar", icon: Archive },
  ],
  fulfilled: [],
  inactive: [
    { to: "active", label: "Reactivar", icon: Target },
  ],
};

export function NeedActions({ need, onChangeStatus }: NeedActionsProps) {
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

  const transitions = TRANSITIONS[need.status] ?? [];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Acciones"
        disabled={loading || transitions.length === 0}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors",
          "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
          "dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
          "disabled:opacity-30 disabled:hover:bg-transparent"
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && transitions.length > 0 && (
        <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
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
        </div>
      )}
    </div>
  );
}