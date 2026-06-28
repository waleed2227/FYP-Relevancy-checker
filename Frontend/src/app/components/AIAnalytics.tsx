/**
 * @deprecated Removed from FYP navigation (2026-06). Not imported by App.tsx.
 */
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Target,
  Brain,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Lightbulb,
} from 'lucide-react';

interface AIAnalyticsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function AIAnalytics({ onLogout, onNavigate }: AIAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester'>('month');

  const analyticsData = {
    overview: {
      totalProjects: 127,
      avgInnovationScore: 78,
      avgSimilarityScore: 32,
      aiConfidence: 85,
      trendsUp: 12,
      trendsDown: 3,
    },
    categoryBreakdown: [
      { category: 'AI/ML', count: 45, avgScore: 82, trend: 'up' },
      { category: 'Web Development', count: 32, avgScore: 75, trend: 'stable' },
      { category: 'Mobile Apps', count: 28, avgScore: 79, trend: 'up' },
      { category: 'IoT/Hardware', count: 15, avgScore: 71, trend: 'down' },
      { category: 'Blockchain', count: 7, avgScore: 68, trend: 'stable' },
    ],
    riskAssessment: [
      {
        id: 1,
        projectTitle: 'Decentralized Healthcare Records',
        studentName: 'Michael Brown',
        riskLevel: 'high',
        riskFactors: ['High similarity (42%)', 'Complex scope', 'Limited feasibility (65%)'],
        recommendation: 'Request scope reduction and differentiation plan',
      },
      {
        id: 2,
        projectTitle: 'Real-time Stock Predictor',
        studentName: 'Sarah Johnson',
        riskLevel: 'medium',
        riskFactors: ['Moderate similarity (35%)', 'Data availability concerns'],
        recommendation: 'Verify data source access before approval',
      },
      {
        id: 3,
        projectTitle: 'Campus Energy Optimizer',
        studentName: 'David Chen',
        riskLevel: 'low',
        riskFactors: ['Low similarity (18%)', 'Strong feasibility'],
        recommendation: 'Good to approve with minor refinements',
      },
    ],
    trendingTopics: [
      { topic: 'Generative AI', count: 23, growth: '+45%' },
      { topic: 'Computer Vision', count: 18, growth: '+32%' },
      { topic: 'Blockchain', count: 12, growth: '-15%' },
      { topic: 'NLP/Chatbots', count: 15, growth: '+28%' },
      { topic: 'IoT Smart Systems', count: 9, growth: '+12%' },
    ],
    aiInsights: [
      {
        icon: Lightbulb,
        title: 'Emerging Trend Detected',
        insight: 'Generative AI projects increased by 45% this semester. Consider updating curriculum to match industry trends.',
        color: 'purple',
      },
      {
        icon: AlertTriangle,
        title: 'High Similarity Alert',
        insight: '15 projects show >40% similarity. Review differentiation strategies with students.',
        color: 'orange',
      },
      {
        icon: Award,
        title: 'Innovation Excellence',
        insight: '8 projects scored 90+ in innovation. Consider showcasing these at the department event.',
        color: 'green',
      },
      {
        icon: TrendingUp,
        title: 'Quality Improvement',
        insight: 'Average project quality increased by 12% compared to last semester.',
        color: 'blue',
      },
    ],
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-400',
          badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        };
      case 'low':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-400',
          badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          text: 'text-gray-700 dark:text-gray-400',
          badge: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400',
        };
    }
  };

  const getInsightColor = (color: string) => {
    switch (color) {
      case 'purple':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
          border: 'border-purple-200 dark:border-purple-700',
          icon: 'text-purple-600 dark:text-purple-400',
        };
      case 'orange':
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
          border: 'border-orange-200 dark:border-orange-700',
          icon: 'text-orange-600 dark:text-orange-400',
        };
      case 'green':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
          border: 'border-green-200 dark:border-green-700',
          icon: 'text-green-600 dark:text-green-400',
        };
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
          border: 'border-blue-200 dark:border-blue-700',
          icon: 'text-blue-600 dark:text-blue-400',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          icon: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="professor" onLogout={onLogout} onNavigate={onNavigate} currentScreen="ai-analytics" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900 dark:text-white">AI Analytics Intelligence</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Advanced insights powered by machine learning
                  </p>
                </div>
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
                  onClick={() => setTimeRange('semester')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    timeRange === 'semester'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Semester
                </button>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">+8.5%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {analyticsData.overview.totalProjects}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">+12%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {analyticsData.overview.avgInnovationScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Innovation Score</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">-5%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {analyticsData.overview.avgSimilarityScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Similarity (Lower is Better)</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Brain className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold">+3%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {analyticsData.overview.aiConfidence}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">AI Confidence</div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">AI-Generated Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsData.aiInsights.map((insight, index) => {
                const Icon = insight.icon;
                const colors = getInsightColor(insight.color);
                return (
                  <div
                    key={index}
                    className={`${colors.bg} border-2 ${colors.border} rounded-xl p-5 transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{insight.title}</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{insight.insight}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Project Categories</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Projects
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {analyticsData.categoryBreakdown.map((category, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{category.category}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{category.count}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                              style={{ width: `${category.avgScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {category.avgScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {category.trend === 'up' ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-semibold">Rising</span>
                          </div>
                        ) : category.trend === 'down' ? (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-sm font-semibold">Declining</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <span className="text-sm font-semibold">Stable</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">AI Risk Assessment</h2>
            <div className="space-y-4">
              {analyticsData.riskAssessment.map((project) => {
                const colors = getRiskColor(project.riskLevel);
                return (
                  <div
                    key={project.id}
                    className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6 transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {project.projectTitle}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{project.studentName}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${colors.badge}`}
                      >
                        {project.riskLevel} Risk
                      </span>
                    </div>
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Risk Factors:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.riskFactors.map((factor, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg`}>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        AI Recommendation:
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white">{project.recommendation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trending Topics */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Trending Research Topics</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-4">
                {analyticsData.trendingTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-900 dark:text-white font-medium">{topic.topic}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            topic.growth.startsWith('+')
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {topic.growth}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                          style={{ width: `${(topic.count / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="ml-6 text-2xl font-bold text-gray-900 dark:text-white">{topic.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
