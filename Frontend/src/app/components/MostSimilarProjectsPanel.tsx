import React from 'react';
import { Layers, AlertTriangle } from 'lucide-react';

export interface MatchedProjectCard {
  project_id: number | null;
  id: number;
  title: string;
  similarity: number;
  year?: string | null;
  status?: string | null;
  author?: string | null;
  category?: string | null;
  risk_level: string;
  description?: string | null;
}

interface MostSimilarProjectsPanelProps {
  projects: MatchedProjectCard[];
  className?: string;
  variant?: 'student' | 'professor';
}

function riskBadgeClass(risk: string): string {
  const r = risk.toUpperCase();
  if (r === 'HIGH') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  if (r === 'MEDIUM') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
}

function formatStatus(status?: string | null): string {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export default function MostSimilarProjectsPanel({
  projects,
  className = '',
  variant = 'student',
}: MostSimilarProjectsPanelProps) {
  const topFive = [...projects]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  const subtitle =
    variant === 'professor'
      ? 'Existing submissions that most closely match this proposal (top 5, highest similarity first)'
      : 'Existing submissions that drove your similarity score (top 5, highest first)';

  const showDescription = variant === 'professor';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Most Similar Projects</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {topFive.length === 0 ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <AlertTriangle className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No similar projects exceeded the similarity threshold.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topFive.map((project) => {
              const displayId = project.project_id ?? project.id;
              return (
                <div
                  key={`${project.id}-${displayId}`}
                  className="rounded-lg border border-gray-200 dark:border-gray-600 p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Project #{displayId}
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4 leading-snug">
                    {project.title}
                  </h4>
                  {showDescription && (
                    <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 p-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Project Description</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {project.description?.trim() || 'No description available for this project.'}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Similarity</div>
                      <div className="font-semibold text-blue-700 dark:text-blue-300">
                        {project.similarity.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Risk</div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${riskBadgeClass(project.risk_level)}`}
                      >
                        {project.risk_level.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category</div>
                      <div className="text-gray-800 dark:text-gray-200">{project.category || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Submitted</div>
                      <div className="text-gray-800 dark:text-gray-200">{project.year || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</div>
                      <div className="text-gray-800 dark:text-gray-200">{formatStatus(project.status)}</div>
                    </div>
                  </div>
                  {project.author && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Author: {project.author}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
