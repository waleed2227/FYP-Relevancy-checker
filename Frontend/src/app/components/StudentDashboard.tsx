import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { PlusCircle, Clock, CheckCircle, XCircle, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import ProjectDetailsModal from './ProjectDetailsModal';
import AIInsightsPanel, { buildStudentDashboardInsights } from './AIInsightsPanel';
import { api, ApiError, parseApiErrorDetail } from '../services/api';

interface StudentDashboardProps {
  onSubmitIdea: () => void;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function StudentDashboard({ onSubmitIdea, onLogout, onNavigate }: StudentDashboardProps) {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState([
    { label: 'Total Submissions', value: '0', icon: TrendingUp, color: 'blue' },
    { label: 'Approved', value: '0', icon: CheckCircle, color: 'green' },
    { label: 'Pending Review', value: '0', icon: Clock, color: 'yellow' },
    { label: 'Rejected', value: '0', icon: XCircle, color: 'red' },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashStats, setDashStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projList, statsData] = await Promise.all([
          api.get<any[]>('/projects/my'),
          api.get<{ total: number; approved: number; pending: number; rejected: number }>('/projects/stats'),
        ]);
        setProjects(projList);
        setDashStats(statsData);
        setStats([
          { label: 'Total Submissions', value: String(statsData.total), icon: TrendingUp, color: 'blue' },
          { label: 'Approved', value: String(statsData.approved), icon: CheckCircle, color: 'green' },
          { label: 'Pending Review', value: String(statsData.pending), icon: Clock, color: 'yellow' },
          { label: 'Rejected', value: String(statsData.rejected), icon: XCircle, color: 'red' },
        ]);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? parseApiErrorDetail(err.detail ?? err.message)
            : 'Failed to load dashboard data.';
        setError(message);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredProjects = projects.filter((project) => {
    if (selectedFilter === 'all') return true;
    return project.status === selectedFilter;
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="student" onLogout={onLogout} onNavigate={onNavigate} currentScreen="dashboard" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-gray-900 dark:text-white mb-2">Student Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your final year project submissions</p>
            </div>
            <button
              onClick={onSubmitIdea}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <PlusCircle className="w-5 h-5" />
              Submit New Idea
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-gray-600 dark:text-gray-400 mb-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading dashboard...</span>
            </div>
          )}

          {error && !loading && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Could not load dashboard</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && (
          <>
          {/* AI Insights Panel */}
          <div className="mb-8">
            <AIInsightsPanel
              loading={loading}
              insights={buildStudentDashboardInsights(projects, dashStats)}
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const filterMap: { [key: string]: string } = {
                'Total Submissions': 'all',
                'Approved': 'approved',
                'Pending Review': 'pending',
                'Rejected': 'rejected',
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

          {/* Projects Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-gray-900 dark:text-white font-semibold">My Project Submissions</h2>
                {/* Filter Buttons */}
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
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Submitted Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Relevancy Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white font-medium">{project.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.technologies}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{project.submittedDate}</td>
                      <td className="px-6 py-4">
                        <span className={`${getRelevancyColor(project.relevancyScore)}`}>
                          {project.relevancyScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{project.professor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          role="student"
        />
      )}
    </div>
  );
}