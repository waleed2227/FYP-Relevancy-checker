import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Users, Code, Clock, CheckCircle } from 'lucide-react';

export interface DashboardInsight {
  icon: 'sparkles' | 'trending' | 'alert' | 'lightbulb' | 'users' | 'code' | 'clock' | 'check';
  title: string;
  value: string;
  tone?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

interface AIInsightsPanelProps {
  insights: DashboardInsight[];
  loading?: boolean;
  emptyMessage?: string;
}

const ICONS = {
  sparkles: Sparkles,
  trending: TrendingUp,
  alert: AlertTriangle,
  lightbulb: Lightbulb,
  users: Users,
  code: Code,
  clock: Clock,
  check: CheckCircle,
};

const TONE_STYLES = {
  blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  green: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
  yellow: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  red: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
};

export function buildStudentDashboardInsights(
  projects: { relevancyScore?: number | null }[],
  stats: { total: number; approved: number; pending: number; rejected: number }
): DashboardInsight[] {
  const scored = projects.filter((p) => p.relevancyScore != null);
  const averageRelevancy =
    scored.length > 0
      ? Math.round(scored.reduce((sum, p) => sum + (p.relevancyScore ?? 0), 0) / scored.length)
      : null;

  return [
    {
      icon: 'trending',
      title: 'Total Submissions',
      value: String(stats.total),
      tone: 'blue',
    },
    {
      icon: 'clock',
      title: 'Pending Review',
      value: String(stats.pending),
      tone: 'yellow',
    },
    {
      icon: 'check',
      title: 'Approved Projects',
      value: String(stats.approved),
      tone: 'green',
    },
    {
      icon: 'lightbulb',
      title: 'Average Relevancy',
      value: averageRelevancy != null ? `${averageRelevancy}%` : 'No scores yet',
      tone: 'purple',
    },
  ];
}

export function buildProfessorDashboardInsights(
  submissions: {
    status: string;
    relevancyScore?: number | null;
    similarityScore?: number | null;
    technologies?: string;
  }[]
): DashboardInsight[] {
  const pending = submissions.filter((s) => s.status === 'pending');
  const highSimilarity = pending.filter((s) => (s.similarityScore ?? 0) >= 40).length;
  const scored = submissions.filter((s) => s.relevancyScore != null);
  const averageRelevancy =
    scored.length > 0
      ? Math.round(scored.reduce((sum, s) => sum + (s.relevancyScore ?? 0), 0) / scored.length)
      : null;

  const techCounts = new Map<string, number>();
  submissions.forEach((s) => {
    (s.technologies || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((tech) => techCounts.set(tech, (techCounts.get(tech) ?? 0) + 1));
  });
  const topTech = [...techCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None yet';

  return [
    {
      icon: 'clock',
      title: 'Pending Review',
      value: String(pending.length),
      tone: 'yellow',
    },
    {
      icon: 'alert',
      title: 'High Similarity (Pending)',
      value: String(highSimilarity),
      tone: 'red',
    },
    {
      icon: 'trending',
      title: 'Average Relevancy',
      value: averageRelevancy != null ? `${averageRelevancy}%` : 'No scores yet',
      tone: 'blue',
    },
    {
      icon: 'code',
      title: 'Most Used Technology',
      value: topTech,
      tone: 'purple',
    },
  ];
}

export default function AIInsightsPanel({
  insights,
  loading = false,
  emptyMessage = 'No dashboard data available yet.',
}: AIInsightsPanelProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border border-blue-100 dark:border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-gray-900 dark:text-white font-semibold">Project Insights</h3>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading insights from your projects...</p>
      ) : insights.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((insight, index) => {
            const Icon = ICONS[insight.icon];
            const tone = TONE_STYLES[insight.tone ?? 'blue'];
            return (
              <div
                key={index}
                className={`${tone.bg} rounded-lg p-4 border border-gray-200 dark:border-gray-600`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${tone.text} mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{insight.title}</div>
                    <div className={`text-sm font-semibold ${tone.text} break-words`}>{insight.value}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
