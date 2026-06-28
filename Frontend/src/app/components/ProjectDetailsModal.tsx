import React from 'react';
import { X, CheckCircle, XCircle, Clock, FileText, Calendar, User, Mail, Code, TrendingUp, Sparkles } from 'lucide-react';

interface ProjectDetailsModalProps {
  project: any;
  onClose: () => void;
  role: 'student' | 'professor';
  onApprove?: (id: number, feedback: string) => void;
  onReject?: (id: number, feedback: string) => void;
}

export default function ProjectDetailsModal({
  project,
  onClose,
  role,
  onApprove,
  onReject
}: ProjectDetailsModalProps) {
  const [feedback, setFeedback] = React.useState('');
  const [showFeedbackForm, setShowFeedbackForm] = React.useState(false);
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);

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

  const handleActionClick = (type: 'approve' | 'reject') => {
    setActionType(type);
    setShowFeedbackForm(true);
  };

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) {
      alert('Please provide feedback');
      return;
    }

    if (actionType === 'approve' && onApprove) {
      onApprove(project.id, feedback);
    } else if (actionType === 'reject' && onReject) {
      onReject(project.id, feedback);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 dark:bg-black dark:bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between backdrop-blur-lg">
          <div className="flex-1">
            <h2 className="text-gray-900 dark:text-white mb-2 font-bold">{project.title}</h2>
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
              <span className={`text-sm font-semibold ${getRelevancyColor(project.relevancyScore)}`}>
                <TrendingUp className="w-4 h-4 inline mr-1" />
                AI Relevancy: {project.relevancyScore}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Submitted Date</div>
                <div className="text-gray-900 dark:text-white font-medium">{project.submittedDate}</div>
              </div>
            </div>

            {role === 'student' ? (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Assigned Professor</div>
                  <div className="text-gray-900 dark:text-white font-medium">{project.professor}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{project.professorEmail}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Student</div>
                  <div className="text-gray-900 dark:text-white font-medium">{project.studentName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{project.studentId}</div>
                </div>
              </div>
            )}
          </div>

          {/* Student Details for Professor */}
          {role === 'professor' && (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-4">
                {/* Student Photo */}
                <div className="flex-shrink-0">
                  {project.studentPhoto ? (
                    <img
                      src={project.studentPhoto}
                      alt={project.studentName}
                      className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 dark:border-blue-400 shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-2 border-blue-500 dark:border-blue-400">
                      <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>

                {/* Student Contact Information */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Full Name</div>
                    <div className="text-gray-900 dark:text-white font-medium">{project.studentName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Student ID</div>
                    <div className="text-gray-900 dark:text-white font-medium">{project.studentId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email Address</div>
                    <div className="text-gray-900 dark:text-white font-medium">{project.studentEmail || 'Not provided'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Phone Number</div>
                    <div className="text-gray-900 dark:text-white font-medium">{project.studentPhone || 'Not provided'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technologies */}
          <div>
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

          {/* Description */}
          {project.description && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Description</div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{project.description}</p>
            </div>
          )}

          {/* Feedback Section */}
          {project.feedback && (
            <div className={`p-4 rounded-lg ${
              project.status === 'approved'
                ? 'bg-green-50 border border-green-200'
                : project.status === 'rejected'
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-start gap-3">
                {project.status === 'approved' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : project.status === 'rejected' ? (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className={`text-sm mb-1 ${
                    project.status === 'approved'
                      ? 'text-green-900'
                      : project.status === 'rejected'
                      ? 'text-red-900'
                      : 'text-yellow-900'
                  }`}>
                    {project.status === 'approved'
                      ? 'Approval Reason'
                      : project.status === 'rejected'
                      ? 'Rejection Reason'
                      : 'Status Update'}
                  </div>
                  <p className={`text-sm ${
                    project.status === 'approved'
                      ? 'text-green-800'
                      : project.status === 'rejected'
                      ? 'text-red-800'
                      : 'text-yellow-800'
                  }`}>
                    {project.feedback}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Form for Professor */}
          {role === 'professor' && project.status === 'pending' && showFeedbackForm && (
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                {actionType === 'approve' ? 'Provide approval reason:' : 'Provide rejection reason:'}
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback for the student..."
                className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSubmitFeedback}
                  className={`flex-1 px-4 py-2 rounded-lg text-white transition-all shadow-md hover:shadow-lg font-medium ${
                    actionType === 'approve'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
                  }`}
                >
                  Submit {actionType === 'approve' ? 'Approval' : 'Rejection'}
                </button>
                <button
                  onClick={() => {
                    setShowFeedbackForm(false);
                    setFeedback('');
                    setActionType(null);
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons for Professor */}
          {role === 'professor' && project.status === 'pending' && !showFeedbackForm && (
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleActionClick('approve')}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-xl font-medium"
              >
                <CheckCircle className="w-5 h-5" />
                Approve Project
              </button>
              <button
                onClick={() => handleActionClick('reject')}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all shadow-md hover:shadow-xl font-medium"
              >
                <XCircle className="w-5 h-5" />
                Reject Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
