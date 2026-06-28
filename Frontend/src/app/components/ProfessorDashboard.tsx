import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FileText, CheckCircle, XCircle, Clock, TrendingUp, Search, Mail, Loader2, AlertCircle } from 'lucide-react';
import AdvancedReviewModal from './AdvancedReviewModal';
import AIInsightsPanel, { buildProfessorDashboardInsights } from './AIInsightsPanel';
import { useAuth } from '../context/AuthContext';
import { api, ApiError, parseApiErrorDetail } from '../services/api';

interface ProfessorDashboardProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function ProfessorDashboard({ onLogout, onNavigate }: ProfessorDashboardProps) {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAssigned = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<any[]>('/projects/assigned');
      setSubmissions(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to load projects.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssigned();
  }, []);

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  const stats = [
    {
      label: 'Pending Review',
      value: pendingCount.toString(),
      icon: Clock,
      color: 'yellow',
    },
    {
      label: 'Approved',
      value: approvedCount.toString(),
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Rejected',
      value: rejectedCount.toString(),
      icon: XCircle,
      color: 'red',
    },
    {
      label: 'Total Submissions',
      value: submissions.length.toString(),
      icon: TrendingUp,
      color: 'blue',
    },
  ];

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesFilter = selectedFilter === 'all' || sub.status === selectedFilter;
    if (!matchesFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sub.studentName?.toLowerCase().includes(q) ||
      sub.projectTitle?.toLowerCase().includes(q) ||
      sub.technologies?.toLowerCase().includes(q)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRelevancyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const submitReview = async (id: number, action: 'approve' | 'reject' | 'revision', feedback: string) => {
    setError(null);
    try {
      await api.post(`/projects/${id}/review`, { action, feedback });
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === id
            ? {
                ...sub,
                status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision',
                feedback,
              }
            : sub
        )
      );
      setSelectedProject(null);
      const label =
        action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent for revision';
      setSuccessMessage(`Project ${label} successfully.`);
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to submit review.';
      setError(message);
      throw err;
    }
  };

  const handleApprove = async (id: number, feedback: string) => {
    await submitReview(id, 'approve', feedback);
  };

  const handleReject = async (id: number, feedback: string) => {
    await submitReview(id, 'reject', feedback);
  };

  const handleRequestRevision = async (id: number, feedback: string) => {
    await submitReview(id, 'revision', feedback);
  };

  const professorEmail = user?.email ?? 'your registered email';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="professor" onLogout={onLogout} onNavigate={onNavigate} currentScreen="dashboard" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-gray-900 dark:text-white mb-2">Professor Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and evaluate project proposals sent to you by students
            </p>
          </div>

          <div className="mb-8">
            <AIInsightsPanel
              loading={loading}
              insights={buildProfessorDashboardInsights(submissions)}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8">
            <div className="flex gap-3">
              <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-blue-900 dark:text-blue-300 mb-1">Email-Based Submissions</div>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Proposals listed below were submitted by students who selected{' '}
                  <span className="font-medium">{professorEmail}</span> as their supervisor.
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-8 text-gray-600 dark:text-gray-400 mb-6">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading assigned projects...</span>
            </div>
          )}

          {error && !loading && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-300 text-sm">
              {successMessage}
            </div>
          )}

          {!loading && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const filterMap: { [key: string]: string } = {
                'Pending Review': 'pending',
                'Approved': 'approved',
                'Rejected': 'rejected',
                'Total Submissions': 'all',
              };
              const filterValue = filterMap[stat.label];
              const isActive = selectedFilter === filterValue;
              return (
                <div
                  key={index}
                  onClick={() => setSelectedFilter(filterValue)}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 cursor-pointer transition-all ${
                    isActive ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        stat.color === 'blue'
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : stat.color === 'green'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : stat.color === 'yellow'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          stat.color === 'blue'
                            ? 'text-blue-600 dark:text-blue-400'
                            : stat.color === 'green'
                            ? 'text-green-600 dark:text-green-400'
                            : stat.color === 'yellow'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-gray-900 dark:text-white font-semibold">Project Submissions</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        selectedFilter === 'all'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedFilter('pending')}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        selectedFilter === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setSelectedFilter('approved')}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        selectedFilter === 'approved'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Approved
                    </button>
                    <button
                      onClick={() => setSelectedFilter('rejected')}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        selectedFilter === 'rejected'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Rejected
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Project Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      AI Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No submissions match your filters.
                      </td>
                    </tr>
                  ) : (
                  filteredSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      onClick={() => setSelectedProject(submission)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white font-medium">{submission.studentName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{submission.studentId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white">{submission.projectTitle}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{submission.technologies}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{submission.submittedDate}</td>
                      <td className="px-6 py-4">
                        <span className={`${getRelevancyColor(submission.relevancyScore ?? 0)}`}>
                          {submission.relevancyScore ?? '—'}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedProject(submission)}
                            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Review"
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      {selectedProject && (
        <AdvancedReviewModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestRevision={handleRequestRevision}
        />
      )}
    </div>
  );
}
