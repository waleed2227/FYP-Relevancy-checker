/**
 * @deprecated Removed from FYP navigation (2026-06). Not imported by App.tsx.
 */
import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { Sparkles, AlertTriangle, TrendingUp, Eye, GitCompare, Filter, Search } from 'lucide-react';

interface AdminAIReportsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function AdminAIReports({ onLogout, onNavigate }: AdminAIReportsProps) {
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const reports = [
    {
      id: 1,
      project1: {
        title: 'AI-Powered Traffic Prediction System',
        student: 'Emma Wilson',
        studentId: 'STU2025012',
        department: 'Computer Science',
      },
      project2: {
        title: 'Real-time Traffic Analysis using ML',
        student: 'David Brown',
        studentId: 'STU2025034',
        department: 'Computer Science',
      },
      similarityScore: 87,
      riskLevel: 'high',
      matchedKeywords: ['Traffic', 'Machine Learning', 'Prediction', 'Real-time', 'Neural Networks'],
      aiAnalysis: 'High structural and conceptual similarity detected. Both projects use LSTM networks for traffic prediction with similar datasets.',
      recommendation: 'Immediate review required. Projects show significant overlap in methodology and scope.',
      detectedDate: '2025-01-15',
      status: 'pending',
    },
    {
      id: 2,
      project1: {
        title: 'E-commerce Product Recommendation Engine',
        student: 'Lisa Anderson',
        studentId: 'STU2025045',
        department: 'Software Engineering',
      },
      project2: {
        title: 'Personalized Shopping Recommendation System',
        student: 'Tom Harris',
        studentId: 'STU2025067',
        department: 'Software Engineering',
      },
      similarityScore: 72,
      riskLevel: 'medium',
      matchedKeywords: ['Recommendation', 'E-commerce', 'Collaborative Filtering', 'User Preferences'],
      aiAnalysis: 'Moderate similarity in core algorithms. Both use collaborative filtering but with different implementation approaches.',
      recommendation: 'Request differentiation plan from both students. Encourage focus on unique aspects.',
      detectedDate: '2025-01-14',
      status: 'reviewed',
    },
    {
      id: 3,
      project1: {
        title: 'Healthcare Diagnostic Chatbot',
        student: 'Rachel Green',
        studentId: 'STU2025023',
        department: 'Data Science',
      },
      project2: {
        title: 'Medical Assistant AI System',
        student: 'John Smith',
        studentId: 'STU2025089',
        department: 'Data Science',
      },
      similarityScore: 65,
      riskLevel: 'medium',
      matchedKeywords: ['Healthcare', 'AI', 'Natural Language Processing', 'Diagnosis'],
      aiAnalysis: 'Similar domain but different technical approaches. One focuses on chatbot interface, other on comprehensive diagnosis.',
      recommendation: 'Acceptable similarity level. Monitor progress to ensure differentiation is maintained.',
      detectedDate: '2025-01-13',
      status: 'approved',
    },
    {
      id: 4,
      project1: {
        title: 'Smart Home IoT Security System',
        student: 'Michael Chen',
        studentId: 'STU2025056',
        department: 'Cybersecurity',
      },
      project2: {
        title: 'Home Automation Security Platform',
        student: 'Sarah Kim',
        studentId: 'STU2025078',
        department: 'Cybersecurity',
      },
      similarityScore: 58,
      riskLevel: 'low',
      matchedKeywords: ['IoT', 'Security', 'Smart Home', 'Automation'],
      aiAnalysis: 'Low to moderate similarity. Projects share domain but have distinct security focuses and implementation strategies.',
      recommendation: 'No action required. Similarity is within acceptable range for same-domain projects.',
      detectedDate: '2025-01-12',
      status: 'approved',
    },
  ];

  const filteredReports = reports.filter(report => {
    if (filterLevel === 'all') return true;
    return report.riskLevel === filterLevel;
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
          glow: 'shadow-red-200/50 dark:shadow-red-900/30',
        };
      case 'medium':
        return {
          bg: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-400',
          badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
          glow: 'shadow-yellow-200/50 dark:shadow-yellow-900/30',
        };
      case 'low':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-700 dark:text-green-400',
          badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
          glow: 'shadow-green-200/50 dark:shadow-green-900/30',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          text: 'text-gray-700 dark:text-gray-400',
          badge: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400',
          glow: '',
        };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'reviewed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar onLogout={onLogout} onNavigate={onNavigate} currentScreen="admin-ai-reports" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900 dark:text-white">AI Relevancy & Similarity Reports</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  AI-powered duplicate detection and similarity analysis
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{reports.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Reports</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                  {reports.filter(r => r.riskLevel === 'high').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">High Risk</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                  {reports.filter(r => r.riskLevel === 'medium').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Medium Risk</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {reports.filter(r => r.riskLevel === 'low').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Low Risk</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <button
                onClick={() => setFilterLevel('all')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterLevel === 'all'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Reports
              </button>
              <button
                onClick={() => setFilterLevel('high')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterLevel === 'high'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                High Risk
              </button>
              <button
                onClick={() => setFilterLevel('medium')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterLevel === 'medium'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Medium Risk
              </button>
              <button
                onClick={() => setFilterLevel('low')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterLevel === 'low'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Low Risk
              </button>
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-6">
            {filteredReports.map((report) => {
              const colors = getRiskColor(report.riskLevel);
              return (
                <div
                  key={report.id}
                  className={`${colors.bg} border-2 ${colors.border} rounded-2xl p-6 transition-all hover:shadow-xl ${colors.glow}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        {report.similarityScore}%
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">AI Similarity Score</div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                            {report.riskLevel.toUpperCase()} RISK
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(report.status)}`}>
                            {report.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                        <GitCompare className="w-4 h-4 inline mr-2" />
                        Compare
                      </button>
                      <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium">
                        <Eye className="w-4 h-4 inline mr-2" />
                        Review Details
                      </button>
                    </div>
                  </div>

                  {/* Projects Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">PROJECT 1</div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2">{report.project1.title}</h3>
                      <div className="space-y-1 text-sm">
                        <div className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Student:</span> {report.project1.student}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">ID:</span> {report.project1.studentId}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Dept:</span> {report.project1.department}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">PROJECT 2</div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2">{report.project2.title}</h3>
                      <div className="space-y-1 text-sm">
                        <div className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Student:</span> {report.project2.student}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">ID:</span> {report.project2.studentId}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Dept:</span> {report.project2.department}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Matched Keywords */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Matched Keywords:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.matchedKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-xs font-medium border border-purple-200 dark:border-purple-800"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 mb-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          AI Analysis:
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {report.aiAnalysis}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className={`${colors.badge} rounded-xl p-4 border-2 ${colors.border}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 ${colors.text} mt-0.5`} />
                      <div>
                        <div className={`text-sm font-semibold ${colors.text} mb-1`}>
                          Recommendation:
                        </div>
                        <p className={`text-sm ${colors.text} leading-relaxed`}>
                          {report.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Detected on: {report.detectedDate}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
