import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Bell, CheckCircle, XCircle, AlertTriangle, Lightbulb, Clock, Trash2, Check, Inbox, Loader2, AlertCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface NotificationsProps {
  role: 'student' | 'professor';
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function Notifications({ role, onLogout, onNavigate }: NotificationsProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai-alerts' | 'approval'>('all');
  const {
    notifications,
    unreadNotificationCount,
    notificationsLoading,
    notificationsError,
    notificationsSuccess,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return CheckCircle;
      case 'rejection':
        return XCircle;
      case 'revision':
        return AlertTriangle;
      case 'ai-alert':
        return AlertTriangle;
      case 'ai-suggestion':
        return Lightbulb;
      case 'supervisor':
        return CheckCircle;
      case 'feedback':
        return Bell;
      case 'deadline':
        return Clock;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'approval':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
        };
      case 'rejection':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
        };
      case 'ai-alert':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          icon: 'text-orange-600 dark:text-orange-400',
        };
      case 'ai-suggestion':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          border: 'border-purple-200 dark:border-purple-800',
          icon: 'text-purple-600 dark:text-purple-400',
        };
      case 'deadline':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
        };
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'ai-alerts') return notification.type === 'ai-alert' || notification.type === 'ai-suggestion';
    if (filter === 'approval') return notification.type === 'approval' || notification.type === 'rejection';
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role={role} onLogout={onLogout} onNavigate={onNavigate} currentScreen="notifications" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-gray-900 dark:text-white">Notifications</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {unreadNotificationCount} unread notification{unreadNotificationCount !== 1 ? 's' : ''}
              </p>
            </div>
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                <Check className="w-4 h-4" />
                Mark All as Read
              </button>
            )}
          </div>

          {notificationsLoading && (
            <div className="flex items-center justify-center gap-3 py-12 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading notifications...</span>
            </div>
          )}

          {notificationsError && !notificationsLoading && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{notificationsError}</p>
            </div>
          )}

          {notificationsSuccess && !notificationsLoading && !notificationsError && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{notificationsSuccess}</p>
            </div>
          )}

          {!notificationsLoading && (
          <>
          {/* Filters */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Unread ({unreadNotificationCount})
            </button>
            <button
              onClick={() => setFilter('ai-alerts')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === 'ai-alerts'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              AI Alerts
            </button>
            <button
              onClick={() => setFilter('approval')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === 'approval'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Approval Updates
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full mb-4">
                  <Inbox className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">You're All Caught Up!</h3>
                <p className="text-gray-500 dark:text-gray-400">No {filter !== 'all' ? filter : ''} notifications to display</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colors = getNotificationColor(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6 transition-all cursor-pointer ${
                      !notification.isRead
                        ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400 shadow-lg hover:shadow-xl'
                        : 'opacity-60 hover:opacity-80 hover:shadow-md'
                    }`}
                    onClick={() => !notification.isRead && markNotificationAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-gray-900 dark:text-white font-semibold mb-1">
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="inline-flex px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{notification.timestamp}</span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              notification.priority === 'high'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : notification.priority === 'medium'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {(notification.priority || 'normal').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
