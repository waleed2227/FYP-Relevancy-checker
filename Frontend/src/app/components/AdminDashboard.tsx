import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './AdminSidebar';
import {
  GraduationCap,
  UserCircle,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Building2,
  Loader2,
  AlertCircle,
  Bell,
  UserPlus,
  Sparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  fetchAdminDashboard,
  type DashboardActivityItem,
  type DashboardDepartmentItem,
  type DuplicateAlertItem,
} from '../services/adminService';
import { ApiError, parseApiErrorDetail } from '../services/api';
import ProjectSearchPanel from './ProjectSearchPanel';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  submission: FileText,
  approval: CheckCircle,
  rejection: XCircle,
  revision: UserCircle,
  registration: UserPlus,
  'ai-alert': AlertTriangle,
  feedback: UserCircle,
  general: Bell,
};

const COLOR_STYLES: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
};

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Unknown time';
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

function activityIcon(type: string): LucideIcon {
  return ACTIVITY_ICONS[type] ?? Bell;
}

function activityColorStyles(color: string) {
  return COLOR_STYLES[color] ?? COLOR_STYLES.blue;
}

function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'high':
      return 'border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    case 'medium':
      return 'border-orange-500 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    default:
      return 'border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
  }
}

export default function AdminDashboard({ onLogout, onNavigate }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recentActivities, setRecentActivities] = useState<DashboardActivityItem[]>([]);
  const [departmentData, setDepartmentData] = useState<DashboardDepartmentItem[]>([]);
  const [duplicateAlerts, setDuplicateAlerts] = useState<DuplicateAlertItem[]>([]);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateAlertItem | null>(null);
  const duplicateSectionRef = useRef<HTMLDivElement>(null);

  const scrollToDuplicateAlerts = () => {
    duplicateSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openDuplicateDetail = (alert: DuplicateAlertItem) => {
    setSelectedDuplicate(alert);
  };
  const [stats, setStats] = useState([
    {
      title: 'Total Students',
      value: '—',
      change: '—',
      trend: 'up' as const,
      icon: GraduationCap,
      color: 'blue',
      bgGradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Total Professors',
      value: '—',
      change: '—',
      trend: 'up' as const,
      icon: UserCircle,
      color: 'purple',
      bgGradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Submitted Projects',
      value: '—',
      change: '—',
      trend: 'up' as const,
      icon: FileText,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Approved Projects',
      value: '—',
      change: '—',
      trend: 'up' as const,
      icon: CheckCircle,
      color: 'teal',
      bgGradient: 'from-teal-500 to-cyan-500',
    },
    {
      title: 'Rejected Projects',
      value: '—',
      change: '—',
      trend: 'down' as const,
      icon: XCircle,
      color: 'red',
      bgGradient: 'from-red-500 to-pink-500',
    },
    {
      title: 'AI Duplicate Alerts',
      value: '—',
      change: '—',
      trend: 'up' as const,
      icon: AlertTriangle,
      color: 'orange',
      bgGradient: 'from-orange-500 to-red-500',
    },
  ]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAdminDashboard();
        setStats([
          {
            title: 'Total Students',
            value: String(data.totalStudents),
            change: 'Live',
            trend: 'up',
            icon: GraduationCap,
            color: 'blue',
            bgGradient: 'from-blue-500 to-cyan-500',
          },
          {
            title: 'Total Professors',
            value: String(data.totalProfessors),
            change: 'Live',
            trend: 'up',
            icon: UserCircle,
            color: 'purple',
            bgGradient: 'from-purple-500 to-pink-500',
          },
          {
            title: 'Submitted Projects',
            value: String(data.submittedProjects),
            change: 'Live',
            trend: 'up',
            icon: FileText,
            color: 'green',
            bgGradient: 'from-green-500 to-emerald-500',
          },
          {
            title: 'Approved Projects',
            value: String(data.approvedProjects),
            change: 'Live',
            trend: 'up',
            icon: CheckCircle,
            color: 'teal',
            bgGradient: 'from-teal-500 to-cyan-500',
          },
          {
            title: 'Rejected Projects',
            value: String(data.rejectedProjects),
            change: 'Live',
            trend: 'down',
            icon: XCircle,
            color: 'red',
            bgGradient: 'from-red-500 to-pink-500',
          },
          {
            title: 'AI Duplicate Alerts',
            value: String(data.aiDuplicateAlerts),
            change: 'Live',
            trend: 'up',
            icon: AlertTriangle,
            color: 'orange',
            bgGradient: 'from-orange-500 to-red-500',
          },
        ]);
        setRecentActivities(data.recentActivities ?? []);
        setDepartmentData(data.departmentBreakdown ?? []);
        setDuplicateAlerts(data.duplicateAlerts ?? []);
        setSuccessMessage('Dashboard statistics loaded from the database.');
      } catch (err) {
        const message =
          err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to load dashboard.';
        setError(message);
        setRecentActivities([]);
        setDepartmentData([]);
        setDuplicateAlerts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar onLogout={onLogout} onNavigate={onNavigate} currentScreen="admin-dashboard" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back! Here's what's happening with your system today.
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-gray-600 dark:text-gray-400 mb-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading dashboard statistics...</span>
            </div>
          )}

          {error && !loading && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {successMessage && !loading && !error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const isDuplicateStat = stat.title === 'AI Duplicate Alerts';
              return (
                <div
                  key={index}
                  role={isDuplicateStat ? 'button' : undefined}
                  tabIndex={isDuplicateStat ? 0 : undefined}
                  onClick={isDuplicateStat ? scrollToDuplicateAlerts : undefined}
                  onKeyDown={
                    isDuplicateStat
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            scrollToDuplicateAlerts();
                          }
                        }
                      : undefined
                  }
                  className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all group ${
                    isDuplicateStat ? 'cursor-pointer ring-offset-2 focus:outline-none focus:ring-2 focus:ring-orange-500' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${stat.bgGradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      stat.trend === 'up'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stat.change}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</div>
                  {isDuplicateStat && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">Click to view duplicate pairs</p>
                  )}
                </div>
              );
            })}
          </div>

          <ProjectSearchPanel className="mb-8" />

          {/* AI Duplicate Detection Alerts — live data from duplicate_reports + matched_projects */}
          <div
            id="duplicate-alerts"
            ref={duplicateSectionRef}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 scroll-mt-8"
          >
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Duplicate Detection Alerts</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {loading
                      ? 'Loading from PostgreSQL…'
                      : `${duplicateAlerts.length} pending pair${duplicateAlerts.length === 1 ? '' : 's'} from duplicate_reports`}
                  </p>
                </div>
              </div>
              {!loading && duplicateAlerts.length > 0 && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                  {duplicateAlerts.length} alert{duplicateAlerts.length === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-3 py-8 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading duplicate project pairs…</span>
              </div>
            ) : duplicateAlerts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center border border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                No duplicate projects detected
              </p>
            ) : (
              <div className="space-y-4">
                {duplicateAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDuplicateDetail(alert)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openDuplicateDetail(alert);
                      }
                    }}
                    className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                          {Math.round(alert.similarity)}%
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Similarity Score</div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getRiskColor(alert.riskLevel)}`}
                          >
                            {alert.riskLevel.toUpperCase()} RISK
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDuplicateDetail(alert);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
                      >
                        View Details
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                            <th className="pb-2 pr-4 font-semibold">Project 1 Title</th>
                            <th className="pb-2 pr-4 font-semibold">Student 1</th>
                            <th className="pb-2 pr-4 font-semibold">Project 2 Title</th>
                            <th className="pb-2 font-semibold">Student 2</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-white align-top">
                              {alert.project1.title}
                            </td>
                            <td className="py-3 pr-4 text-gray-700 dark:text-gray-300 align-top">
                              {alert.project1.studentName}
                            </td>
                            <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-white align-top">
                              {alert.project2.title}
                            </td>
                            <td className="py-3 text-gray-700 dark:text-gray-300 align-top">
                              {alert.project2.studentName}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Activities */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activities</h2>
              </div>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                  No recent activity recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const Icon = activityIcon(activity.type);
                    const styles = activityColorStyles(activity.color);
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${styles.bg}`}>
                          <Icon className={`w-5 h-5 ${styles.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            {activity.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {activity.description}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mt-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(activity.occurredAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Department Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Department Wise</h2>
              </div>
              {departmentData.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                  No departments or projects in the database yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {departmentData.map((dept) => (
                    <div key={dept.department}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{dept.department}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{dept.projects}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {dept.students} students · {dept.professors} professors
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all"
                          style={{ width: `${Math.min(dept.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedDuplicate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Duplicate Pair Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(selectedDuplicate.similarity)}% similarity · Detected {selectedDuplicate.detectedDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDuplicate(null)}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getRiskColor(selectedDuplicate.riskLevel)}`}>
                  {selectedDuplicate.riskLevel.toUpperCase()} RISK
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Status: {selectedDuplicate.status}</span>
              </div>

              {selectedDuplicate.aiAnalysis && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">AI Analysis</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedDuplicate.aiAnalysis}</p>
                </div>
              )}

              {selectedDuplicate.recommendation && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Recommendation</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedDuplicate.recommendation}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[selectedDuplicate.project1, selectedDuplicate.project2].map((project, idx) => (
                  <div
                    key={project.id}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Project {idx + 1} Title (ID {project.id})</p>
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">{project.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Student {idx + 1}: {project.studentName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{project.technologies}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">{project.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Status: {project.status} · Submitted {project.submittedDate}
                    </p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDuplicate(null);
                  onNavigate('admin-projects');
                }}
                className="w-full py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Open Project Ideas list
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



