"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  notificationsApi,
  type Notification,
} from "@/lib/api";
import { formatRelativeTime } from "@/lib/format";
import { getNotificationContent } from "@/lib/notification-content";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [skip, setSkip] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.list({
        unread_only: unreadOnly,
        skip,
        limit: PAGE_SIZE,
      });
      setNotifications(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudieron cargar las notificaciones");
    } finally {
      setIsLoading(false);
    }
  }, [unreadOnly, skip]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (id: number) => {
    await notificationsApi.markRead(id);
    await load();
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      await load();
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => n.read_at === null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Actividad relevante de tus operaciones.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            loading={markingAll}
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <div className="inline-flex overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
        <Tab active={!unreadOnly} onClick={() => { setUnreadOnly(false); setSkip(0); }}>
          Todas
        </Tab>
        <Tab active={unreadOnly} onClick={() => { setUnreadOnly(true); setSkip(0); }}>
          Sin leer
        </Tab>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-6 dark:bg-danger-500/10">
          <p className="text-sm text-danger-700 dark:text-danger-500">{error}</p>
          <Button variant="ghost" size="sm" onClick={load} className="mt-2">
            Reintentar
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
          <EmptyState
            icon={Bell}
            title={unreadOnly ? "Sin notificaciones sin leer" : "Sin notificaciones"}
            description="Aquí verás ofertas, transacciones y aprobaciones."
          />
        </div>
      ) : (
        <>
          <ul className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700/50 dark:bg-neutral-900">
            {notifications.map((n) => {
              const content = getNotificationContent(n);
              const isUnread = n.read_at === null;

              return (
                <li
                  key={n.id}
                  className={cn(
                    "border-b border-neutral-100 last:border-0 dark:border-neutral-800",
                    isUnread && "bg-primary-50/40 dark:bg-primary-500/5"
                  )}
                >
                  <Link
                    href={content.href}
                    onClick={() => {
                      if (isUnread) handleMarkRead(n.id);
                    }}
                    className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
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
                      <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
                        {content.body}
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {formatRelativeTime(n.created_at)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <Pagination
            skip={skip}
            limit={PAGE_SIZE}
            hasNext={notifications.length === PAGE_SIZE}
            onPageChange={setSkip}
          />
        </>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-500 text-white"
          : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
      )}
    >
      {children}
    </button>
  );
}