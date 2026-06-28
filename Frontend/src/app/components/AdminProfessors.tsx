import React, { useEffect, useMemo, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import {
  UserCircle,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Award,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  deleteAdminProfessor,
  fetchAdminProfessorStats,
  fetchAdminProfessors,
  type ProfessorListItem,
  type ProfessorStats,
} from '../services/adminService';
import { ApiError, parseApiErrorDetail } from '../services/api';
import AdminCreateUserModal from './AdminCreateUserModal';
import AdminProfessorDetailModal from './AdminProfessorDetailModal';
import AdminEditProfessorModal from './AdminEditProfessorModal';

interface AdminProfessorsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function AdminProfessors({ onLogout, onNavigate }: AdminProfessorsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [professors, setProfessors] = useState<ProfessorListItem[]>([]);
  const [stats, setStats] = useState<ProfessorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewProfessorId, setViewProfessorId] = useState<number | null>(null);
  const [editProfessor, setEditProfessor] = useState<ProfessorListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProfessorListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadProfessors = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, professorStats] = await Promise.all([
        fetchAdminProfessors(),
        fetchAdminProfessorStats(),
      ]);
      setProfessors(list);
      setStats(professorStats);
      setSuccessMessage(`Loaded ${list.length} professor${list.length === 1 ? '' : 's'} from the database.`);
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to load professors.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfessors();
  }, []);

  const departments = useMemo(() => {
    const depts = new Set(professors.map((p) => p.department).filter((d) => d && d !== 'N/A'));
    return ['all', ...Array.from(depts).sort()];
  }, [professors]);

  const filteredProfessors = professors.filter((professor) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      professor.name.toLowerCase().includes(q) ||
      professor.email.toLowerCase().includes(q) ||
      (professor.professorId || '').toLowerCase().includes(q);
    const matchesDepartment = departmentFilter === 'all' || professor.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAdminProfessor(deleteTarget.id);
      setDeleteTarget(null);
      setSuccessMessage(`${deleteTarget.name} was deleted successfully.`);
      await loadProfessors();
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to delete professor.';
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar onLogout={onLogout} onNavigate={onNavigate} currentScreen="admin-professors" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-gray-900 dark:text-white mb-2">Professor Management</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage professor accounts and project supervision
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Professor
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading professors...</span>
            </div>
          )}

          {error && !loading && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {successMessage && !loading && !error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {!loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <UserCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.totalProfessors ?? professors.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Professors</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <UserCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.activeProfessors ?? professors.filter((p) => p.status === 'active').length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.totalSupervisedProjects ??
                          professors.reduce((sum, p) => sum + p.projectsSupervised, 0)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Supervised</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.averageRating ?? 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search professors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept === 'all' ? 'All Departments' : dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {filteredProfessors.length === 0 ? (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  {professors.length === 0
                    ? 'No professors found in the database.'
                    : 'No professors match your search.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredProfessors.map((professor) => (
                    <div
                      key={professor.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {professor.photoUrl ? (
                          <img
                            src={professor.photoUrl}
                            alt={professor.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-purple-500 dark:border-purple-400 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg border-2 border-purple-500 dark:border-purple-400 flex-shrink-0">
                            {professor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{professor.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{professor.professorId}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(professor.status)}`}>
                              {professor.status.charAt(0).toUpperCase() + professor.status.slice(1)}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">{professor.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">{professor.phone || 'Not Provided'}</span>
                            </div>
                            {professor.specialization && (
                              <div className="flex items-center gap-2 text-sm">
                                <Award className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                <span className="text-gray-700 dark:text-gray-300">{professor.specialization}</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Department</div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">{professor.department}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Projects Supervised</div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {professor.projectsSupervised}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewProfessorId(professor.id)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              View Profile
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditProfessor(professor)}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Edit professor"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(professor);
                              }}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete professor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AdminCreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        fixedRole="professor"
        title="Add Professor"
        onCreated={(message) => {
          setError(null);
          setSuccessMessage(message);
          loadProfessors();
        }}
      />

      {viewProfessorId !== null && (
        <AdminProfessorDetailModal
          professorId={viewProfessorId}
          onClose={() => setViewProfessorId(null)}
        />
      )}

      {editProfessor && (
        <AdminEditProfessorModal
          professor={editProfessor}
          open={!!editProfessor}
          onClose={() => setEditProfessor(null)}
          onSaved={(message) => {
            setError(null);
            setSuccessMessage(message);
            loadProfessors();
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Professor</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
