/**
 * @deprecated Removed from FYP navigation (2026-06). Not imported by App.tsx.
 */
import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { BarChart3, TrendingUp, Users, FileText, CheckCircle, Target } from 'lucide-react';

interface AdminAnalyticsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function AdminAnalytics({ onLogout, onNavigate }: AdminAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const analytics = {
    userGrowth: [
      { month: 'Jan', students: 120, professors: 15 },
      { month: 'Feb', students: 145, professors: 18 },
      { month: 'Mar', students: 167, professors: 20 },
      { month: 'Apr', students: 189, professors: 22 },
    ],
    submissionTrends: [
      { month: 'Jan', submissions: 45 },
      { month: 'Feb', submissions: 67 },
      { month: 'Mar', submissions: 89 },
      { month: 'Apr', submissions: 112 },
    ],
    approvalRates: {
      approved: 68,
      rejected: 15,
      pending: 17,
    },
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar onLogout={onLogout} onNavigate={onNavigate} currentScreen="admin-analytics" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-gray-900 dark:text-white mb-2">System Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track system performance and user activity
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimeRange('week')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  timeRange === 'week'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  timeRange === 'month'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  timeRange === 'year'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Year
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">+12%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">1,247</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">+28%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">342</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Submissions</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">+15%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">68%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Approval Rate</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">+8%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">85%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">AI Accuracy</div>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">User Growth Trend</h2>
            <div className="space-y-4">
              {analytics.userGrowth.map((data, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{data.month}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-blue-600 dark:text-blue-400">Students: {data.students}</span>
                      <span className="text-purple-600 dark:text-purple-400">Professors: {data.professors}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
                        style={{ width: `${(data.students / 200) * 100}%` }}
                      />
                    </div>
                    <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                        style={{ width: `${(data.professors / 25) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Rate Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Project Approval Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Approved</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {analytics.approvalRates.approved}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-emerald-600"
                    style={{ width: `${analytics.approvalRates.approved}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending</span>
                  <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                    {analytics.approvalRates.pending}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-600 to-orange-600"
                    style={{ width: `${analytics.approvalRates.pending}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rejected</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {analytics.approvalRates.rejected}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-pink-600"
                    style={{ width: `${analytics.approvalRates.rejected}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
