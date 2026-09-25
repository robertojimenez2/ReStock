"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { NotificationDropdown } from "./notification-dropdown";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const {
    count,
    recent,
    isLoading,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications(true);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // Refrescar al abrir (por si el polling aún no llegó)
  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const hasUnread = count.unread > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notificaciones${hasUnread ? ` (${count.unread} sin leer)` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-md",
          "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
          "dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
          open && "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
        )}
      >
        <Bell className="h-4 w-4" />
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 font-mono text-[10px] font-medium text-white">
            {count.unread > 99 ? "99+" : count.unread}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={recent}
          isLoading={isLoading}
          onClose={() => setOpen(false)}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />
      )}
    </div>
  );
}