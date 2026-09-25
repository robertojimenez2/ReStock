"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ApiError,
  notificationsApi,
  type Notification,
  type NotificationCount,
} from "@/lib/api";

const POLL_INTERVAL_MS = 30_000;

interface UseNotificationsReturn {
  count: NotificationCount;
  recent: Notification[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(enabled: boolean): UseNotificationsReturn {
  const [count, setCount] = useState<NotificationCount>({
    total: 0,
    unread: 0,
  });
  const [recent, setRecent] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([
        notificationsApi.count(),
        notificationsApi.list({ limit: 10 }),
      ]);
      setCount(c);
      setRecent(r);
    } catch (err) {
      // Silencioso: no rompemos la UI por un fallo de notificaciones
      if (err instanceof ApiError && err.isUnauthorized) {
        setCount({ total: 0, unread: 0 });
        setRecent([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    refresh();
    intervalRef.current = window.setInterval(refresh, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, refresh]);

  const markRead = useCallback(
    async (id: number) => {
      await notificationsApi.markRead(id);
      await refresh();
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    await refresh();
  }, [refresh]);

  return {
    count,
    recent,
    isLoading,
    refresh,
    markRead,
    markAllRead,
  };
}