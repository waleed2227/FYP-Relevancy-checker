import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { FileText, ArrowLeft } from 'lucide-react';
import { api, ApiError, parseApiErrorDetail } from '../services/api';
import { validateProposalForm } from '../utils/proposalValidation';
import {
  ProposalFormFields,
  PROPOSAL_FORM_DEFAULTS,
  PROJECT_CATEGORIES,
  proposalFieldsToApiPayload,
  serializeAiTechnologies,
} from './ProjectProposalSections';

interface IdeaSubmissionFormProps {
  onSubmit: (idea: any) => void;
  onCancel: () => void;
  onLogout: () => void;
}

function fieldInputClass(hasError: boolean) {
  return `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
    hasError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
  }`;
}

export default function IdeaSubmissionForm({ onSubmit, onCancel, onLogout }: IdeaSubmissionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    technologies: '',
    description: '',
    professorEmail: '',
    ...PROPOSAL_FORM_DEFAULTS,
  });
  const [selectedAiTech, setSelectedAiTech] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (error) setError('');
  };

  const handleAiTechToggle = (tech: string) => {
    setSelectedAiTech((prev) => {
      const next = new Set(prev);
      if (next.has(tech)) next.delete(tech);
      else next.add(tech);
      setFormData((fd) => ({ ...fd, aiTechnologiesUsed: serializeAiTechnologies(next) }));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errors = validateProposalForm({
      ...formData,
      aiTechnologiesUsed: serializeAiTechnologies(selectedAiTech),
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        technologies: formData.technologies.trim(),
        description: formData.description.trim(),
        professor_email: formData.professorEmail.trim(),
        ...proposalFieldsToApiPayload({
          ...formData,
          aiTechnologiesUsed: serializeAiTechnologies(selectedAiTech),
        }),
      };
      const project = await api.post<{
        id: number;
        title: string;
        technologies: string;
        description: string;
        relevancyScore: number | null;
      }>('/projects', payload);
      onSubmit({ ...formData, id: project.id, relevancyScore: project.relevancyScore });
    } catch (err) {
      setError(err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const section1Fields = (
    <>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Project Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter a descriptive title for your FYP"
          className={fieldInputClass(!!fieldErrors.title)}
        />
        {fieldErrors.title && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.title}</p>}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Project Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          placeholder="Provide a comprehensive overview of your Final Year Project..."
          className={`${fieldInputClass(!!fieldErrors.description)} resize-none`}
        />
        {fieldErrors.description && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
          <label htmlFor="targetIndustry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Industry *
          </label>
          <input
            id="targetIndustry"
            name="targetIndustry"
            type="text"
            value={formData.targetIndustry}
            onChange={handleChange}
            placeholder="e.g. Healthcare, Education, FinTech"
            className={fieldInputClass(!!fieldErrors.targetIndustry)}
          />
          {fieldErrors.targetIndustry && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.targetIndustry}</p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="student" onLogout={onLogout} onNavigate={() => {}} currentScreen="submit-idea" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-gray-900 dark:text-white text-xl font-semibold">FYP Proposal Submission</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Complete all required sections before submitting for AI relevancy analysis
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Section 1: Project Overview</h3>
                </div>
                <div className="p-5 space-y-4 bg-white dark:bg-gray-900/40">{section1Fields}</div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-900/40 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Supervisor & Technical Details</h3>
                <div>
                  <label htmlFor="technologies" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Technologies / Tools *
                  </label>
                  <input
                    id="technologies"
                    name="technologies"
                    type="text"
                    value={formData.technologies}
                    onChange={handleChange}
                    placeholder="e.g., Python, TensorFlow, React, PostgreSQL"
                    className={fieldInputClass(!!fieldErrors.technologies)}
                  />
                  {fieldErrors.technologies && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.technologies}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="professorEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Professor Email *
                  </label>
                  <input
                    id="professorEmail"
                    name="professorEmail"
                    type="email"
                    value={formData.professorEmail}
                    onChange={handleChange}
                    placeholder="professor@uol.edu.pk"
                    className={fieldInputClass(!!fieldErrors.professorEmail)}
                  />
                  {fieldErrors.professorEmail && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors.professorEmail}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Your supervisor must already be registered in the system.
                  </p>
                </div>
              </div>

              <ProposalFormFields
                values={formData}
                onChange={handleChange}
                onAiTechToggle={handleAiTechToggle}
                selectedAiTech={selectedAiTech}
                fieldErrors={fieldErrors}
              />

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-1">AI Relevancy Check</div>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  After submission, the weighted relevancy engine analyzes your proposal — including problem
                  statement, proposed solution, innovation aspects, scope, market context, and core project fields —
                  against existing submissions. An Ollama-powered explanation summarizes similarity and novelty after
                  scoring completes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 pt-2 pb-8">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                {error && <p className="text-sm text-red-600 dark:text-red-400 sm:mr-auto">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Proposal for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
