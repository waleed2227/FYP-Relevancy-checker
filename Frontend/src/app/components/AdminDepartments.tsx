/**
 * @deprecated Removed from FYP navigation (2026-06). Not imported by App.tsx.
 */
import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { Building2, Search, Plus, Edit, Trash2, Users, FileText, Award } from 'lucide-react';

interface AdminDepartmentsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function AdminDepartments({ onLogout, onNavigate }: AdminDepartmentsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const departments = [
    {
      id: 1,
      name: 'Computer Science',
      code: 'CS',
      head: 'Dr. Michael Smith',
      studentCount: 456,
      professorCount: 23,
      projectsCount: 145,
      description: 'Department focused on core computer science fundamentals and advanced topics',
      established: '1985',
      building: 'Science Block A',
      color: 'blue',
    },
    {
      id: 2,
      name: 'Software Engineering',
      code: 'SE',
      head: 'Dr. Sarah Lee',
      studentCount: 389,
      professorCount: 18,
      projectsCount: 98,
      description: 'Specialized in software development methodologies and engineering practices',
      established: '1992',
      building: 'Engineering Block B',
      color: 'purple',
    },
    {
      id: 3,
      name: 'Data Science',
      code: 'DS',
      head: 'Dr. Robert Johnson',
      studentCount: 298,
      professorCount: 15,
      projectsCount: 67,
      description: 'Focus on big data analytics, machine learning, and statistical analysis',
      established: '2010',
      building: 'Innovation Hub',
      color: 'green',
    },
    {
      id: 4,
      name: 'Cybersecurity',
      code: 'CYB',
      head: 'Dr. Emily Davis',
      studentCount: 167,
      professorCount: 12,
      projectsCount: 32,
      description: 'Dedicated to information security, ethical hacking, and network protection',
      established: '2015',
      building: 'Security Center',
      color: 'red',
    },
    {
      id: 5,
      name: 'Artificial Intelligence',
      code: 'AI',
      head: 'Dr. Lisa Anderson',
      studentCount: 234,
      professorCount: 16,
      projectsCount: 89,
      description: 'Advanced AI research, neural networks, and intelligent systems development',
      established: '2018',
      building: 'AI Research Center',
      color: 'orange',
    },
  ];

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.head.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColorClasses = (color: string) => {
    const colors: any = {
      blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
      },
      purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
      },
      green: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
      },
      red: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
      },
      orange: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
      },
    };
    return colors[color] || colors.blue;
  };

  const totalStudents = departments.reduce((sum, dept) => sum + dept.studentCount, 0);
  const totalProfessors = departments.reduce((sum, dept) => sum + dept.professorCount, 0);
  const totalProjects = departments.reduce((sum, dept) => sum + dept.projectsCount, 0);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar onLogout={onLogout} onNavigate={onNavigate} currentScreen="admin-departments" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-gray-900 dark:text-white mb-2">Department Management</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage university departments and organizational structure
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium">
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{departments.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Departments</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Students</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalProfessors}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Professors</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalProjects}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Departments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDepartments.map((dept) => {
              const colorClasses = getColorClasses(dept.color);
              return (
                <div
                  key={dept.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 ${colorClasses.bg} rounded-lg`}>
                        <Building2 className={`w-6 h-6 ${colorClasses.text}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{dept.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Code: {dept.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{dept.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Department Head</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{dept.head}</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Building</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{dept.building}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700/50 dark:to-blue-900/20 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{dept.studentCount}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Students</div>
                    </div>
                    <div className="text-center border-l border-r border-gray-300 dark:border-gray-600">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{dept.professorCount}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Professors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{dept.projectsCount}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Projects</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Established: {dept.established}</span>
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
