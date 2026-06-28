import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { FileText, Search, Calendar, TrendingUp, Loader2, AlertCircle, CheckCircle, Eye, Edit2, X } from 'lucide-react';
import { api, parseApiErrorDetail, ApiError } from '../services/api';
import ProjectProposalSections, {
  ProposalFormFields,
  PROPOSAL_FORM_DEFAULTS,
  parseAiTechnologies,
  proposalFieldsFromProject,
  PROJECT_CATEGORIES,
  proposalFieldsToApiPayload,
  serializeAiTechnologies,
  type ProposalFields,
} from './ProjectProposalSections';

interface MyProjectsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

interface ProjectItem extends ProposalFields {
  id: number;
  title: string;
  technologies: string;
  description: string;
  submittedDate: string;
  status: string;
  relevancyScore: number | null;
  professor: string | null;
  professorEmail?: string;
}

export default function MyProjects({ onLogout, onNavigate }: MyProjectsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [detailProject, setDetailProject] = useState<ProjectItem | null>(null);
  const [editProject, setEditProject] = useState<ProjectItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    technologies: '',
    description: '',
    professorEmail: '',
    ...PROPOSAL_FORM_DEFAULTS,
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editAiTech, setEditAiTech] = useState<Set<string>>(new Set());

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ProjectItem[]>('/projects/my');
      setProjects(data);
      setSuccessMessage(`Loaded ${data.length} project${data.length === 1 ? '' : 's'} from your account.`);
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to load projects.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.technologies.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'revision':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const canEdit = (status: string) => status === 'pending' || status === 'revision';

  const openEdit = (project: ProjectItem) => {
    setEditProject(project);
    const fields = proposalFieldsFromProject(project);
    setEditForm({
      title: project.title,
      technologies: project.technologies,
      description: project.description,
      professorEmail: project.professorEmail || '',
      ...fields,
    });
    setEditAiTech(parseAiTechnologies(fields.aiTechnologiesUsed));
    setEditError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditAiTechToggle = (tech: string) => {
    setEditAiTech((prev) => {
      const next = new Set(prev);
      if (next.has(tech)) next.delete(tech);
      else next.add(tech);
      setEditForm((fd) => ({ ...fd, aiTechnologiesUsed: serializeAiTechnologies(next) }));
      return next;
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProject) return;
    setSaving(true);
    setEditError(null);
    try {
      await api.patch(`/projects/${editProject.id}`, {
        title: editForm.title,
        technologies: editForm.technologies,
        description: editForm.description,
        professor_email: editForm.professorEmail,
        ...proposalFieldsToApiPayload({
          ...editForm,
          aiTechnologiesUsed: serializeAiTechnologies(editAiTech),
        }),
      });
      setEditProject(null);
      setSuccessMessage('Project updated successfully.');
      await loadProjects();
    } catch (err) {
      setEditError(
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to update project.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="student" onLogout={onLogout} onNavigate={onNavigate} currentScreen="my-projects" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-gray-900 dark:text-white mb-2">My Projects</h1>
            <p className="text-gray-600 dark:text-gray-400">View and manage all your project submissions</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading your projects...</span>
            </div>
          )}

          {error && !loading && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Could not load projects</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {successMessage && !loading && !error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="mb-6">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  {projects.length === 0
                    ? 'You have not submitted any projects yet.'
                    : 'No projects match your search.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>

                      <h3 className="text-gray-900 dark:text-white font-semibold mb-2">{project.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {project.submittedDate}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {project.relevancyScore != null
                              ? `${Math.round(project.relevancyScore)}% Relevancy`
                              : 'Relevancy pending'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mb-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Supervisor</div>
                        <div className="text-sm text-gray-900 dark:text-white">{project.professor || 'Not assigned'}</div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailProject(project)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                        {canEdit(project.status) && (
                          <button
                            type="button"
                            onClick={() => openEdit(project)}
                            className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {detailProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{detailProject.title}</h2>
              <button type="button" onClick={() => setDetailProject(null)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{detailProject.technologies}</p>
              <ProjectProposalSections project={detailProject} />
            </div>
          </div>
        </div>
      )}

      {editProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Project Proposal</h2>
              <button type="button" onClick={() => setEditProject(null)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{editError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input name="title" value={editForm.title} onChange={handleEditChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Technologies</label>
                <input name="technologies" value={editForm.technologies} onChange={handleEditChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Professor Email</label>
                <input name="professorEmail" type="email" value={editForm.professorEmail} onChange={handleEditChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea name="description" value={editForm.description} onChange={handleEditChange} required rows={5} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select category</option>
                  {PROJECT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Industry</label>
                <input
                  name="targetIndustry"
                  type="text"
                  value={editForm.targetIndustry}
                  onChange={handleEditChange}
                  placeholder="e.g., Healthcare, Education, Finance"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <ProposalFormFields
                values={editForm}
                onChange={handleEditChange}
                onAiTechToggle={handleEditAiTechToggle}
                selectedAiTech={editAiTech}
              />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditProject(null)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
