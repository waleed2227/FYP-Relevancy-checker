import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { FileText, Search, Filter, Eye, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface AdminProjectsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function AdminProjects({ onLogout, onNavigate }: AdminProjectsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const projects = [
    {
      id: 1,
      title: 'AI-Powered Traffic Prediction System',
      student: 'Emma Wilson',
      studentId: 'STU2025012',
      professor: 'Dr. Michael Smith',
      department: 'Computer Science',
      submittedDate: '2025-01-15',
      status: 'approved',
      aiScore: 87,
      technologies: 'Python, TensorFlow, Keras',
    },
    {
      id: 2,
      title: 'Blockchain Healthcare Records',
      student: 'Michael Brown',
      studentId: 'STU2025008',
      professor: 'Dr. Sarah Lee',
      department: 'Software Engineering',
      submittedDate: '2025-01-14',
      status: 'pending',
      aiScore: 72,
      technologies: 'Ethereum, Solidity, IPFS',
    },
    {
      id: 3,
      title: 'E-commerce Recommendation Engine',
      student: 'Lisa Anderson',
      studentId: 'STU2025045',
      professor: 'Dr. Robert Johnson',
      department: 'Data Science',
      submittedDate: '2025-01-13',
      status: 'approved',
      aiScore: 85,
      technologies: 'Python, Scikit-learn, Flask',
    },
    {
      id: 4,
      title: 'Smart Home IoT Security System',
      student: 'David Chen',
      studentId: 'STU2025056',
      professor: 'Dr. Emily Davis',
      department: 'Cybersecurity',
      submittedDate: '2025-01-12',
      status: 'rejected',
      aiScore: 58,
      technologies: 'Arduino, Raspberry Pi, Node.js',
    },
    {
      id: 5,
      title: 'Real-time Chat Application',
      student: 'Sarah Kim',
      studentId: 'STU2025078',
      professor: 'Dr. Michael Smith',
      department: 'Computer Science',
      submittedDate: '2025-01-11',
      status: 'pending',
      aiScore: 76,
      technologies: 'React, Socket.io, MongoDB',
    },
  ];

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar onLogout={onLogout} onNavigate={onNavigate} currentScreen="admin-projects" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-gray-900 dark:text-white mb-2">Project Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all submitted project ideas
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{projects.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {projects.filter(p => p.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {projects.filter(p => p.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                {projects.filter(p => p.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Professor
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      AI Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{project.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{project.technologies}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white">{project.student}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{project.studentId}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{project.professor}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`w-4 h-4 ${getScoreColor(project.aiScore)}`} />
                          <span className={`font-semibold ${getScoreColor(project.aiScore)}`}>
                            {project.aiScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(project.status)}`}>
                          {getStatusIcon(project.status)}
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{project.submittedDate}</td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
