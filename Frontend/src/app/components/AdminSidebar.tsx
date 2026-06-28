import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCircle,
  FileText,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface AdminSidebarProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  currentScreen?: string;
}

export default function AdminSidebar({ onLogout, onNavigate, currentScreen = 'admin-dashboard' }: AdminSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', screen: 'admin-dashboard' },
    { icon: Users, label: 'Users', screen: 'admin-users' },
    { icon: GraduationCap, label: 'Students', screen: 'admin-students' },
    { icon: UserCircle, label: 'Professors', screen: 'admin-professors' },
    { icon: FileText, label: 'Project Ideas', screen: 'admin-projects' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen transition-colors">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-gray-900 dark:text-white font-semibold">AI Project System</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Admin Portal</p>
          </div>
        </div>
      </div>

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
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <div className="px-4 py-2">
          <div className="text-sm text-gray-900 dark:text-white font-medium truncate">
            {user?.full_name || 'Administrator'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">admin</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
        </div>

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
