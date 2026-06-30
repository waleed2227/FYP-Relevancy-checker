import React from 'react';
import { X, Calendar, User, Mail, Code, FileText } from 'lucide-react';
import ProjectProposalSections, { type ProposalFields } from './ProjectProposalSections';

export interface ProjectSearchRecord extends ProposalFields {
  id: number;
  title: string;
  projectTitle?: string | null;
  studentName: string;
  studentId: string;
  studentEmail: string;
  studentPhone?: string | null;
  studentPhoto?: string | null;
  professorName?: string | null;
  professorEmail?: string | null;
  technologies: string;
  description: string;
  submittedDate: string;
  status: string;
  feedback?: string | null;
  category?: string | null;
  targetIndustry?: string | null;
}

interface ProjectSearchDetailModalProps {
  project: ProjectSearchRecord;
  onClose: () => void;
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export default function ProjectSearchDetailModal({
  project,
  onClose,
}: ProjectSearchDetailModalProps) {
  const displayTitle = project.projectTitle ?? project.title;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Project #{project.id}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{displayTitle}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
              <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {formatStatus(project.status)}
              </span>
              {project.category && (
                <span className="text-gray-600 dark:text-gray-400">{project.category}</span>
              )}
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {project.submittedDate}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Student
              </h3>
              <p className="text-sm text-gray-900 dark:text-white font-medium">{project.studentName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{project.studentId}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" />
                {project.studentEmail}
              </p>
              {project.studentPhone && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.studentPhone}</p>
              )}
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Professor
              </h3>
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                {project.professorName || '—'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{project.professorEmail || '—'}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Technologies</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.technologies.split(',').map((tech, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  {tech.trim()}
                </span>
              ))}
            </div>
          </div>

          {project.description && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {project.description}
              </p>
            </div>
          )}

          {project.targetIndustry && (
            <p className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Target Industry:</span>{' '}
              <span className="text-gray-900 dark:text-white">{project.targetIndustry}</span>
            </p>
          )}

          <ProjectProposalSections project={project} />

          {project.feedback && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Professor Feedback</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{project.feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
