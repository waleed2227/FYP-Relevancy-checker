import React, { useEffect, useState } from 'react';
import { X, Loader2, Mail, Phone, Award, FileText, Calendar, UserCircle } from 'lucide-react';
import { fetchAdminProfessorDetail, type ProfessorDetail } from '../services/adminService';
import { ApiError, parseApiErrorDetail } from '../services/api';

interface AdminProfessorDetailModalProps {
  professorId: number;
  onClose: () => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'rejected':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'revision':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'approve':
      return 'text-green-600 dark:text-green-400';
    case 'reject':
      return 'text-red-600 dark:text-red-400';
    case 'revision':
      return 'text-orange-600 dark:text-orange-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

export default function AdminProfessorDetailModal({ professorId, onClose }: AdminProfessorDetailModalProps) {
  const [detail, setDetail] = useState<ProfessorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAdminProfessorDetail(professorId)
      .then(setDetail)
      .catch((err) => {
        const message =
          err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to load professor profile.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [professorId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UserCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Professor Profile</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-gray-600 dark:text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading profile...</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-6 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}

        {detail && !loading && (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              {detail.photoUrl ? (
                <img
                  src={detail.photoUrl}
                  alt={detail.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                  {detail.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{detail.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{detail.professorId}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                    <Mail className="w-4 h-4" /> {detail.email}
                  </span>
                  {detail.phone && (
                    <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <Phone className="w-4 h-4" /> {detail.phone}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  detail.status === 'active'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
              >
                {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Department</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{detail.department}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Specialization</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {detail.specialization || 'Not Provided'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Projects Supervised</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{detail.projectsSupervised}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Joined</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{detail.joinedDate}</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Assigned Projects
              </h4>
              {detail.assignedProjects.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No supervised projects yet.</p>
              ) : (
                <div className="space-y-2">
                  {detail.assignedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{project.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Student: {project.studentName} · {project.submittedDate}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Review History
              </h4>
              {detail.reviewHistory.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No reviews recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {detail.reviewHistory.map((review) => (
                    <div key={review.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{review.projectTitle}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Student: {review.studentName} · {new Date(review.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <span className={`text-xs font-semibold uppercase ${getActionColor(review.action)}`}>
                          {review.action}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{review.feedback}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Data loaded from PostgreSQL via admin professor detail API.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
