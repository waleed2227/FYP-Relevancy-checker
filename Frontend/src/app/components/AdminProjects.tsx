import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import {
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api, ApiError, parseApiErrorDetail } from '../services/api';
import ProjectProposalSections, { type ProposalFields } from './ProjectProposalSections';
import RelevancyExplanationPanel, { type RelevancyExplanationData } from './RelevancyExplanationPanel';

interface AdminProjectsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

interface ProjectRow extends ProposalFields {
  id: number;
  title: string;
  studentName: string;
  studentId: string;
  studentEmail: string;
  technologies: string;
  description: string;
  submittedDate: string;
  status: string;
  aiScore: number | null;
}

export default function AdminProjects({ onLogout, onNavigate }: AdminProjectsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'revision'>('all');
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailProject, setDetailProject] = useState<ProjectRow | null>(null);
  const [detailExplanation, setDetailExplanation] = useState<RelevancyExplanationData | null>(null);
  const [detailSimilarityScore, setDetailSimilarityScore] = useState<number | null>(null);
  const [detailRelevancyLoading, setDetailRelevancyLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<(ProjectRow & {
          studentName: string;
          studentId: string;
          studentEmail: string;
          relevancyScore?: number | null;
          innovationScore?: number | null;
          primaryTargetUsers?: string | null;
        })[]>('/projects/all');
        setProjects(
          data.map((p) => ({
            ...p,
            primaryTargetUsers: p.primaryTargetUsers ?? (p as { targetUsers?: string }).targetUsers,
            submittedDate: p.submittedDate,
            aiScore: p.innovationScore ?? p.relevancyScore ?? null,
          }))
        );
      } catch (err) {
        const message =
          err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to load projects.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!detailProject) {
      setDetailExplanation(null);
      setDetailSimilarityScore(null);
      return;
    }

    const loadRelevancy = async () => {
      setDetailRelevancyLoading(true);
      try {
        const data = await api.get<{
          explanation?: RelevancyExplanationData | null;
        }>(`/projects/${detailProject.id}/relevancy`);
        setDetailExplanation(data.explanation ?? null);
        setDetailSimilarityScore(data.explanation?.similarity_score ?? null);
      } catch {
        setDetailExplanation(null);
        setDetailSimilarityScore(null);
      } finally {
        setDetailRelevancyLoading(false);
      }
    };

    loadRelevancy();
  }, [detailProject?.id]);

  const filteredProjects = projects.filter((project) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      project.title.toLowerCase().includes(q) ||
      project.studentName.toLowerCase().includes(q) ||
      project.studentId.toLowerCase().includes(q) ||
      project.technologies.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'revision':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar onLogout={onLogout} onNavigate={onNavigate} currentScreen="admin-projects" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-gray-900 dark:text-white mb-2">Project Ideas</h1>
            <p className="text-gray-600 dark:text-gray-400">
              All submitted project ideas from PostgreSQL
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-gray-600 dark:text-gray-400 mb-6">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading projects...</span>
            </div>
          )}

          {error && !loading && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{projects.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {projects.filter((p) => p.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {projects.filter((p) => p.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                {projects.filter((p) => p.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="revision">Revision</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      AI Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No projects match your search.
                      </td>
                    </tr>
                  ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{project.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{project.technologies}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white">{project.studentName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{project.studentId}</div>
                      </td>
                      <td className="px-6 py-4">
                        {project.aiScore != null ? (
                          <div className="flex items-center gap-2">
                            <TrendingUp className={`w-4 h-4 ${getScoreColor(project.aiScore)}`} />
                            <span className={`font-semibold ${getScoreColor(project.aiScore)}`}>
                              {Math.round(project.aiScore)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(project.status)}`}
                        >
                          {getStatusIcon(project.status)}
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{project.submittedDate}</td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setDetailProject(project)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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

      {detailProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{detailProject.title}</h2>
              <button
                type="button"
                onClick={() => setDetailProject(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-gray-500">Student:</span> {detailProject.studentName} ({detailProject.studentId})</p>
              <p><span className="text-gray-500">Email:</span> {detailProject.studentEmail}</p>
              <p><span className="text-gray-500">Technologies:</span> {detailProject.technologies}</p>
              <p><span className="text-gray-500">Status:</span> {detailProject.status}</p>
              <p><span className="text-gray-500">Submitted:</span> {detailProject.submittedDate}</p>
            </div>
            <ProjectProposalSections project={detailProject} />
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">AI Project Analysis</h3>
              {detailRelevancyLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading AI explanation...
                </div>
              ) : (
                <RelevancyExplanationPanel
                  explanation={detailExplanation}
                  similarityScore={detailSimilarityScore}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
