import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Calendar,
  Code,
  TrendingUp,
  Target,
  Zap,
  Sparkles,
} from 'lucide-react';
import ProjectProposalSections from './ProjectProposalSections';
import RelevancyExplanationPanel, { type RelevancyExplanationData } from './RelevancyExplanationPanel';
import { api } from '../services/api';

interface AdvancedReviewModalProps {
  project: any;
  onClose: () => void;
  onApprove: (id: number, feedback: string) => void;
  onReject: (id: number, feedback: string) => void;
  onRequestRevision: (id: number, feedback: string) => void;
}

export default function AdvancedReviewModal({
  project,
  onClose,
  onApprove,
  onReject,
  onRequestRevision,
}: AdvancedReviewModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<RelevancyExplanationData | null>(
    project.aiExplanation ?? null
  );
  const [explanationSimilarity, setExplanationSimilarity] = useState<number | null>(
    project.similarityScore ?? null
  );

  const aiFeedbackSuggestions = explanation?.novelty_suggestions ?? [];

  useEffect(() => {
    if (project.aiExplanation) {
      setExplanation(project.aiExplanation);
      setExplanationSimilarity(project.similarityScore ?? project.aiExplanation.similarity_score ?? null);
      return;
    }

    const load = async () => {
      try {
        const data = await api.get<{
          explanation?: RelevancyExplanationData | null;
        }>(`/projects/${project.id}/relevancy`);
        setExplanation(data.explanation ?? null);
        setExplanationSimilarity(data.explanation?.similarity_score ?? project.similarityScore ?? null);
      } catch {
        setExplanation(null);
      }
    };

    load();
  }, [project.id, project.aiExplanation, project.similarityScore]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const handleSubmit = () => {
    if (!feedback.trim()) {
      alert('Please provide feedback');
      return;
    }

    if (action === 'approve') {
      onApprove(project.id, feedback);
    } else if (action === 'reject') {
      onReject(project.id, feedback);
    } else if (action === 'revision') {
      onRequestRevision(project.id, feedback);
    }
  };

  const applySuggestion = (suggestion: string, index: number) => {
    setFeedback(suggestion);
    setSelectedSuggestion(index);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 dark:bg-black dark:bg-opacity-85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-start justify-between z-10 rounded-t-2xl">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-bold">AI-Assisted Project Review</h2>
            </div>
            <p className="text-blue-100 text-sm">Intelligent evaluation workspace with AI insights</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Profile Section */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Student Profile
            </h3>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {project.studentPhoto ? (
                  <img
                    src={project.studentPhoto}
                    alt={project.studentName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 dark:border-blue-400 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-4 border-blue-500 dark:border-blue-400">
                    <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Full Name</div>
                  <div className="text-gray-900 dark:text-white font-semibold">{project.studentName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Student ID</div>
                  <div className="text-gray-900 dark:text-white font-semibold">{project.studentId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Submitted</div>
                  <div className="text-gray-900 dark:text-white font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {project.submittedDate}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium text-sm">
                    {project.studentEmail || 'Not provided'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium text-sm">
                    {project.studentPhone || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{project.projectTitle}</h3>

            {/* Technologies */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Technologies</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.technologies.split(',').map((tech: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-800"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>

            <ProjectProposalSections project={project} className="mt-4" />
          </div>

          {/* AI Evaluation Summary */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Evaluation Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Innovation Score</span>
                  <span className={`text-lg font-bold ${getScoreColor(project.innovationScore)}`}>
                    {project.innovationScore}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreBg(project.innovationScore)} transition-all`}
                    style={{ width: `${project.innovationScore}%` }}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Similarity Score</span>
                  <span className={`text-lg font-bold ${project.similarityScore > 40 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {project.similarityScore}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${project.similarityScore > 40 ? 'from-red-500 to-pink-500' : 'from-green-500 to-emerald-500'} transition-all`}
                    style={{ width: `${project.similarityScore}%` }}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Feasibility Score</span>
                  <span className={`text-lg font-bold ${getScoreColor(project.feasibilityScore)}`}>
                    {project.feasibilityScore}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreBg(project.feasibilityScore)} transition-all`}
                    style={{ width: `${project.feasibilityScore}%` }}
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI Confidence</span>
                  <span className={`text-lg font-bold ${getScoreColor(project.aiConfidence)}`}>
                    {project.aiConfidence}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getScoreBg(project.aiConfidence)} transition-all`}
                    style={{ width: `${project.aiConfidence}%` }}
                  />
                </div>
              </div>
            </div>

            <RelevancyExplanationPanel
              explanation={explanation}
              similarityScore={explanationSimilarity}
              className="!bg-white/80 dark:!bg-gray-800/80 !border-purple-200 dark:!border-purple-800"
            />
          </div>

          {/* AI-Generated Feedback Suggestions */}
          {!action && aiFeedbackSuggestions.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Feedback Suggestions</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Suggestions from the stored relevancy explanation. Click to use as feedback draft.
              </p>
              <div className="space-y-2">
                {aiFeedbackSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => applySuggestion(suggestion, index)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedSuggestion === index
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-100 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="text-sm text-gray-700 dark:text-gray-300">{suggestion}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Selection */}
          {!action && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setAction('approve')}
                className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 rounded-xl hover:shadow-lg transition-all group"
              >
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">Approve Project</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Accept this proposal and allow student to proceed
                </span>
              </button>

              <button
                onClick={() => setAction('revision')}
                className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-2 border-orange-200 dark:border-orange-800 rounded-xl hover:shadow-lg transition-all group"
              >
                <AlertTriangle className="w-12 h-12 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">Request Revision</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Ask student to revise and resubmit with improvements
                </span>
              </button>

              <button
                onClick={() => setAction('reject')}
                className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-2 border-red-200 dark:border-red-800 rounded-xl hover:shadow-lg transition-all group"
              >
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">Reject Project</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Decline this proposal with detailed feedback
                </span>
              </button>
            </div>
          )}

          {/* Feedback Form */}
          {action && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {action === 'approve' && 'Approval Feedback'}
                  {action === 'reject' && 'Rejection Reason'}
                  {action === 'revision' && 'Revision Requirements'}
                </h3>
                <button
                  onClick={() => {
                    setAction(null);
                    setFeedback('');
                    setSelectedSuggestion(null);
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Change Decision
                </button>
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  action === 'approve'
                    ? 'Describe what is strong in this project, unique points, and recommended improvements...'
                    : action === 'reject'
                    ? 'Explain the rejection reason, missing areas, weaknesses, and suggestions for improvement...'
                    : 'List the specific revisions required and areas that need improvement...'
                }
                className="w-full h-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSubmit}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-md hover:shadow-xl ${
                    action === 'approve'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      : action === 'reject'
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
                      : 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700'
                  }`}
                >
                  {action === 'approve' && <CheckCircle className="w-5 h-5" />}
                  {action === 'reject' && <XCircle className="w-5 h-5" />}
                  {action === 'revision' && <AlertTriangle className="w-5 h-5" />}
                  Submit {action === 'approve' ? 'Approval' : action === 'reject' ? 'Rejection' : 'Revision Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
