import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationApi,
  type NotificationItem,
} from '../services/notificationService';
import { parseApiErrorDetail, ApiError } from '../services/api';

interface Notification extends NotificationItem {
  icon?: unknown;
}

interface AISuggestion {
  id: number;
  isRead: boolean;
  [key: string]: unknown;
}

interface NotificationContextType {
  notifications: Notification[];
  aiSuggestions: AISuggestion[];
  unreadNotificationCount: number;
  unreadAISuggestionCount: number;
  notificationsLoading: boolean;
  notificationsError: string | null;
  notificationsSuccess: string | null;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: number) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  markAISuggestionAsRead: (id: number) => void;
  dismissAISuggestion: (id: number) => void;
  applyAISuggestion: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationsSuccess, setNotificationsSuccess] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
      if (data.length > 0) {
        setNotificationsSuccess(`Loaded ${data.length} notification${data.length === 1 ? '' : 's'}.`);
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to load notifications.';
      setNotificationsError(message);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    const savedAISuggestions = localStorage.getItem('aiSuggestions');
    if (savedAISuggestions) {
      setAISuggestions(JSON.parse(savedAISuggestions));
    }
  }, []);

  useEffect(() => {
    if (aiSuggestions.length > 0) {
      localStorage.setItem('aiSuggestions', JSON.stringify(aiSuggestions));
    }
  }, [aiSuggestions]);

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;
  const unreadAISuggestionCount = aiSuggestions.filter((s) => !s.isRead).length;

  const markNotificationAsRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setNotificationsSuccess('Notification marked as read.');
      setNotificationsError(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to mark notification as read.';
      setNotificationsError(message);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setNotificationsSuccess('All notifications marked as read.');
      setNotificationsError(null);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? parseApiErrorDetail(err.detail ?? err.message)
          : 'Failed to mark all notifications as read.';
      setNotificationsError(message);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await deleteNotificationApi(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setNotificationsSuccess('Notification deleted.');
      setNotificationsError(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to delete notification.';
      setNotificationsError(message);
    }
  };

  const markAISuggestionAsRead = (id: number) => {
    setAISuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, isRead: true } : s)));
  };

  const dismissAISuggestion = (id: number) => {
    setAISuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const applyAISuggestion = (id: number) => {
    setAISuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        aiSuggestions,
        unreadNotificationCount,
        unreadAISuggestionCount,
        notificationsLoading,
        notificationsError,
        notificationsSuccess,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        markAISuggestionAsRead,
        dismissAISuggestion,
        applyAISuggestion,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
