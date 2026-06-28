import { api } from './api';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority?: string;
  color?: string;
}

export function fetchNotifications() {
  return api.get<NotificationItem[]>('/notifications');
}

export function markNotificationRead(id: number) {
  return api.patch<{ message: string }>(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return api.patch<{ message: string }>('/notifications/read-all');
}

export function deleteNotification(id: number) {
  return api.delete<{ message: string }>(`/notifications/${id}`);
}
