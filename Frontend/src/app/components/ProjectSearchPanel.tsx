import React, { useCallback, useEffect, useState } from 'react';
import { Search, Loader2, AlertCircle, Eye } from 'lucide-react';
import { api, ApiError, parseApiErrorDetail } from '../services/api';
import ProjectSearchDetailModal, { type ProjectSearchRecord } from './ProjectSearchDetailModal';

interface ProjectSearchPanelProps {
  className?: string;
  /** Re-fetch when professor approves/rejects (submissions list changes). */
  refreshKey?: number | string;
}

export default function ProjectSearchPanel({ className = '', refreshKey }: ProjectSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProjectSearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailProject, setDetailProject] = useState<ProjectSearchRecord | null>(null);

  const runSearch = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const q = searchTerm.trim();
      const url = q
        ? `/projects/search?q=${encodeURIComponent(q)}`
        : '/projects/search';
      const data = await api.get<ProjectSearchRecord[]>(url);
      setResults(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? parseApiErrorDetail(err.detail ?? err.message)
          : 'Failed to load projects.';
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delay = query.trim() ? 350 : 0;
    const timer = window.setTimeout(() => {
      runSearch(query);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [query, runSearch, refreshKey]);

  const openDetails = async (project: ProjectSearchRecord) => {
    try {
      const data = await api.get<ProjectSearchRecord>(`/projects/${project.id}`);
      setDetailProject(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? parseApiErrorDetail(err.detail ?? err.message)
          : 'Could not load project details.';
      setError(message);
    }
  };

  return (
    <>
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm ${className}`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Approved Projects Database
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Reference library of <strong>professor-approved</strong> projects only — the same corpus the
            AI checks relevancy against. Pending, rejected, and revision proposals are never shown here.
            Search by <strong>project ID, title, or description</strong> to show a student exactly which
            approved projects already cover their idea and what features those projects include.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by project ID, title, or description..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => runSearch(query)}
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              Search
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 py-6 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading projects...
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
              No approved projects match your filter.
            </p>
          )}

          {!loading && results.length > 0 && (
            <div className="overflow-x-auto">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Showing {results.length} approved project{results.length === 1 ? '' : 's'} in the database
              </p>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400">ID</th>
                    <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400">Title</th>
                    <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400">Student</th>
                    <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400">Professor</th>
                    <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400">Category</th>
                    <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400">Technologies</th>
                    <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs uppercase text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">#{project.id}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white max-w-[220px]">
                        <span className="line-clamp-2">{project.projectTitle ?? project.title}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{project.studentName}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {project.professorName || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[140px] truncate">
                        {project.category || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[160px] truncate">
                        {project.technologies}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {project.submittedDate}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openDetails(project)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-xs font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {detailProject && (
        <ProjectSearchDetailModal
          project={detailProject}
          onClose={() => setDetailProject(null)}
        />
      )}
    </>
  );
}
