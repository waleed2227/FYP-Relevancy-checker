/**
 * @deprecated Removed from FYP navigation (2026-06). Not imported by App.tsx.
 */
import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { CheckCircle, XCircle, Clock, Eye, FileText, AlertTriangle } from 'lucide-react';

interface AdminApprovalsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function AdminApprovals({ onLogout, onNavigate }: AdminApprovalsProps) {
  const pendingApprovals = [
    {
      id: 1,
      type: 'project',
      title: 'Blockchain Healthcare Records',
      submittedBy: 'Michael Brown (STU2025008)',
      professor: 'Dr. Sarah Lee',
      submittedDate: '2025-01-14',
      department: 'Software Engineering',
      priority: 'high',
      aiScore: 72,
    },
    {
      id: 2,
      type: 'project',
      title: 'Real-time Chat Application',
      submittedBy: 'Sarah Kim (STU2025078)',
      professor: 'Dr. Michael Smith',
      submittedDate: '2025-01-11',
      department: 'Computer Science',
      priority: 'medium',
      aiScore: 76,
    },
    {
      id: 3,
      type: 'revision',
      title: 'Smart Home IoT Security - Revision',
      submittedBy: 'David Chen (STU2025056)',
      professor: 'Dr. Emily Davis',
      submittedDate: '2025-01-10',
      department: 'Cybersecurity',
      priority: 'low',
      aiScore: 68,
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar onLogout={onLogout} onNavigate={onNavigate} currentScreen="admin-approvals" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-gray-900 dark:text-white mb-2">Pending Approvals</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and approve pending project submissions
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingApprovals.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {pendingApprovals.filter(p => p.priority === 'high').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">High Priority</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">45</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Approved Today</div>
                </div>
              </div>
            </div>
          </div>

          {/* Approvals List */}
          <div className="space-y-4">
            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{approval.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(approval.priority)}`}>
                        {approval.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Submitted by:</span>{' '}
                        <span className="text-gray-900 dark:text-white font-medium">{approval.submittedBy}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Professor:</span>{' '}
                        <span className="text-gray-900 dark:text-white font-medium">{approval.professor}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Department:</span>{' '}
                        <span className="text-gray-900 dark:text-white font-medium">{approval.department}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">AI Score:</span>{' '}
                        <span className="text-gray-900 dark:text-white font-medium">{approval.aiScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg font-medium">
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
