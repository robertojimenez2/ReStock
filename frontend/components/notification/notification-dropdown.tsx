"use client";

import { CheckCheck } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Bell } from "lucide-react";
import type { Notification } from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { getNotificationContent } from "@/lib/notification-content";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading: boolean;
  onClose: () => void;
  onMarkRead: (id: number) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

export function NotificationDropdown({
  notifications,
  isLoading,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  const handleClick = async (n: Notification) => {
    if (n.read_at === null) {
      await onMarkRead(n.id);
    }
    onClose();
  };

  return (
    <div className="absolute right-0 top-full z-30 mt-1 w-96 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          Notificaciones
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todas
          </button>
        )}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Sin notificaciones"
          description="Aquí verás ofertas, transacciones y aprobaciones."
          className="py-8"
        />
      ) : (
        <ul className="max-h-96 overflow-y-auto">
          {notifications.map((n) => {
            const content = getNotificationContent(n);
            const isUnread = n.read_at === null;

            return (
              <li key={n.id}>
                <Link
                  href={content.href}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "flex items-start gap-3 border-b border-neutral-100 px-4 py-3 transition-colors last:border-0 dark:border-neutral-800",
                    isUnread
                      ? "bg-primary-50/40 hover:bg-primary-50 dark:bg-primary-500/5 dark:hover:bg-primary-500/10"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  )}
                >
                  <div
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      isUnread ? "bg-primary-500" : "bg-transparent"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {content.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                      {content.body}
                    </p>
                    <p className="mt-1 text-[10px] text-neutral-400">
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer */}
      <div className="border-t border-neutral-100 p-2 dark:border-neutral-800">
        <Link
          href="/notificaciones"
          onClick={onClose}
          className="block w-full rounded-md py-2 text-center text-xs font-medium text-primary-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          Ver todas
        </Link>
      </div>
    </div>
  );
}