import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from './AdminSidebar';
import { GraduationCap, Search, Filter, Plus, Eye, Mail, Phone, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchAdminStudents, type StudentListItem } from '../services/adminService';
import { ApiError, parseApiErrorDetail } from '../services/api';
import AdminRecordDetailModal, { type AdminRecordDetail } from './AdminRecordDetailModal';
import AdminCreateUserModal from './AdminCreateUserModal';

interface AdminStudentsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function AdminStudents({ onLogout, onNavigate }: AdminStudentsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewRecord, setViewRecord] = useState<AdminRecordDetail | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminStudents();
      setStudents(data);
      setSuccessMessage(`Loaded ${data.length} student${data.length === 1 ? '' : 's'} from the database.`);
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to load students.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const departments = useMemo(() => {
    const depts = new Set(students.map((s) => s.department).filter(Boolean));
    return ['all', ...Array.from(depts).sort()];
  }, [students]);

  const filteredStudents = students.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || student.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const totalProjects = students.reduce((sum, s) => sum + s.projectsCount, 0);

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar onLogout={onLogout} onNavigate={onNavigate} currentScreen="admin-students" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-gray-900 dark:text-white mb-2">Student Management</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage student accounts and project submissions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading students...</span>
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
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Students</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {students.filter(s => s.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalProjects}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">—</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg GPA</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search students..."
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

          {/* Students Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg border-2 border-blue-500 dark:border-blue-400 flex-shrink-0">
                    {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{student.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{student.studentId}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(student.status)}`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">{student.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">N/A</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Department</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{student.department}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Projects</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{student.projectsCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">GPA</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">—</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setViewRecord({
                            kind: 'student',
                            name: student.name,
                            email: student.email,
                            studentId: student.studentId,
                            department: student.department,
                            status: student.status,
                            joinedDate: student.joinedDate,
                            projectsCount: student.projectsCount,
                          })
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </div>
      </div>

      {viewRecord && <AdminRecordDetailModal record={viewRecord} onClose={() => setViewRecord(null)} />}

      <AdminCreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        fixedRole="student"
        title="Add Student"
        onCreated={(message) => {
          setError(null);
          setSuccessMessage(message);
          loadStudents();
        }}
      />
    </div>
  );
}
