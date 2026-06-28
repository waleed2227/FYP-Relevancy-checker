import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import AdvancedReviewModal from './AdvancedReviewModal';
import { Clock, TrendingUp, AlertTriangle, Eye, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { api, ApiError, parseApiErrorDetail } from '../services/api';

interface ReviewQueueProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function ReviewQueue({ onLogout, onNavigate }: ReviewQueueProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<any[]>('/projects/review-queue');
      setSubmissions(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to load review queue.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const submitReview = async (id: number, action: 'approve' | 'reject' | 'revision', feedback: string) => {
    setError(null);
    try {
      await api.post(`/projects/${id}/review`, { action, feedback });
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setSelectedSubmission(null);
      const label = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent for revision';
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="professor" onLogout={onLogout} onNavigate={onNavigate} currentScreen="review-queue" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-gray-900 dark:text-white mb-2">Review Queue</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Projects awaiting your review - {submissions.length} pending
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading review queue...</span>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {!loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      AI Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No projects pending review.
                      </td>
                    </tr>
                  ) : (
                  submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white font-medium">{submission.studentName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{submission.studentId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white">{submission.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {submission.technologies}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{submission.submittedDate}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getScoreBg(submission.innovationScore || 0)}`}>
                          <TrendingUp className={`w-4 h-4 ${getScoreColor(submission.innovationScore || 0)}`} />
                          <span className={`font-semibold ${getScoreColor(submission.innovationScore || 0)}`}>
                            {submission.innovationScore ?? '—'}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedSubmission({ ...submission, projectTitle: submission.title || submission.projectTitle })}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Advanced Review Modal */}
      {selectedSubmission && (
        <AdvancedReviewModal
          project={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestRevision={handleRequestRevision}
        />
      )}
    </div>
  );
}
