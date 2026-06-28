/**
 * @deprecated Removed from FYP navigation (2026-06). Not imported by App.tsx.
 */
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { FileText, Search, Filter } from 'lucide-react';

interface AllProjectsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function AllProjects({ onLogout, onNavigate }: AllProjectsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const projects = [
    {
      id: 1,
      studentName: 'John Doe',
      projectTitle: 'AI-Powered Code Review Assistant',
      technologies: 'Python, TensorFlow, NLP',
      submittedDate: '2025-01-20',
      status: 'pending',
      innovationScore: 85,
    },
    {
      id: 2,
      studentName: 'Emma Wilson',
      projectTitle: 'Real-time Traffic Prediction System',
      technologies: 'Python, Keras, Google Maps API',
      submittedDate: '2025-01-22',
      status: 'pending',
      innovationScore: 91,
    },
    {
      id: 3,
      studentName: 'Sarah Davis',
      projectTitle: 'Smart Campus Energy Management',
      technologies: 'Arduino, Node.js, MongoDB',
      submittedDate: '2025-01-18',
      status: 'approved',
      innovationScore: 88,
    },
    {
      id: 4,
      studentName: 'James Miller',
      projectTitle: 'Social Media Sentiment Analyzer',
      technologies: 'Python, NLTK, Twitter API',
      submittedDate: '2025-01-17',
      status: 'approved',
      innovationScore: 82,
    },
    {
      id: 5,
      studentName: 'Lisa Anderson',
      projectTitle: 'Online Shopping Cart System',
      technologies: 'PHP, MySQL, Bootstrap',
      submittedDate: '2025-01-16',
      status: 'rejected',
      innovationScore: 42,
    },
  ];

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="professor" onLogout={onLogout} onNavigate={onNavigate} currentScreen="all-projects" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-gray-900 dark:text-white mb-2">All Projects</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete overview of all project submissions - {projects.length} total
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by project title or student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Projects Table */}
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
                      Submitted Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Innovation Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white font-medium">{project.studentName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-white">{project.projectTitle}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{project.technologies}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{project.submittedDate}</td>
                      <td className="px-6 py-4">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {project.innovationScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
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
