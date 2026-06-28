import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  LogOut,
  Users,
  BarChart3,
  CheckCircle,
  UserCircle,
  Sparkles,
  Bell,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

interface SidebarProps {
  role: 'student' | 'professor' | 'admin';
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  currentScreen?: string;
}

export default function Sidebar({ role, onLogout, onNavigate, currentScreen = 'dashboard' }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { unreadNotificationCount, unreadAISuggestionCount } = useNotifications();

  const studentMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', screen: 'dashboard', badge: 0 },
    { icon: FileText, label: 'My Projects', screen: 'my-projects', badge: 0 },
    { icon: Sparkles, label: 'AI Suggestions', screen: 'ai-suggestions', badge: unreadAISuggestionCount },
    { icon: Bell, label: 'Notifications', screen: 'notifications', badge: unreadNotificationCount },
    { icon: UserCircle, label: 'My Profile', screen: 'profile', badge: 0 },
  ];

  const professorMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', screen: 'dashboard', badge: 0 },
    { icon: CheckCircle, label: 'Review Queue', screen: 'review-queue', badge: 0 },
    { icon: FileText, label: 'All Projects', screen: 'all-projects', badge: 0 },
    { icon: BarChart3, label: 'AI Analytics', screen: 'ai-analytics', badge: 0 },
    { icon: Bell, label: 'Notifications', screen: 'notifications', badge: unreadNotificationCount },
    { icon: UserCircle, label: 'My Profile', screen: 'profile', badge: 0 },
  ];

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', screen: 'dashboard' },
    { icon: Users, label: 'User Management', screen: 'user-management' },
    { icon: FileText, label: 'Projects', screen: 'projects' },
    { icon: BarChart3, label: 'Analytics', screen: 'analytics' },
  ];

  const menuItems =
    role === 'student'
      ? studentMenuItems
      : role === 'professor'
      ? professorMenuItems
      : adminMenuItems;

  const roleLabels = {
    student: 'Student Portal',
    professor: 'Professor Portal',
    admin: 'Admin Portal',
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen transition-colors">
      {/* Logo and Title */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-gray-900 dark:text-white font-semibold">AI Project System</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabels[role]}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.screen;
            return (
              <button
                key={index}
                onClick={() => onNavigate(item.screen)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold rounded-full min-w-[20px] text-center shadow-md animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Theme Toggle & User Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        {/* User Info */}
        <div className="px-4 py-2">
          <div className="text-sm text-gray-900 dark:text-white font-medium">
            {role === 'student' && 'Alex Johnson'}
            {role === 'professor' && 'Dr. Sarah Smith'}
            {role === 'admin' && 'Admin User'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {role === 'student' && 'ID: STU2025025'}
            {role === 'professor' && 'Computer Science Dept.'}
            {role === 'admin' && 'System Administrator'}
          </p>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
