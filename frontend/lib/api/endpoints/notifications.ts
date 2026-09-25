import { apiClient } from "../client";
import type { Notification, NotificationCount } from "../types";

export interface ListNotificationsParams {
  unread_only?: boolean;
  skip?: number;
  limit?: number;
}

export const notificationsApi = {
  list(params: ListNotificationsParams = {}): Promise<Notification[]> {
    return apiClient.get<Notification[]>("/notifications", { params: {...params} });
  },

  count(): Promise<NotificationCount> {
    return apiClient.get<NotificationCount>("/notifications/count");
  },

  markRead(id: number): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}/read`);
  },

  markAllRead(): Promise<{ updated: number }> {
    return apiClient.patch<{ updated: number }>("/notifications/read-all");
  },
};