import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { FileText, ArrowLeft, Upload, X, File } from 'lucide-react';
import { api } from '../services/api';
import { ApiError } from '../services/api';
import { ProposalFormFields, PROPOSAL_FORM_DEFAULTS } from './ProjectProposalSections';

interface IdeaSubmissionFormProps {
  onSubmit: (idea: any) => void;
  onCancel: () => void;
  onLogout: () => void;
}

export default function IdeaSubmissionForm({ onSubmit, onCancel, onLogout }: IdeaSubmissionFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    technologies: '',
    description: '',
    professorEmail: '',
    ...PROPOSAL_FORM_DEFAULTS,
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter((file) => {
        const fileType = file.name.toLowerCase();
        return fileType.endsWith('.pdf') || fileType.endsWith('.docx') || fileType.endsWith('.doc');
      });
      setUploadedFiles([...uploadedFiles, ...validFiles]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter((file) => {
        const fileType = file.name.toLowerCase();
        return fileType.endsWith('.pdf') || fileType.endsWith('.docx') || fileType.endsWith('.doc');
      });
      setUploadedFiles([...uploadedFiles, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    if (filename.toLowerCase().endsWith('.pdf')) {
      return 'text-red-600 bg-red-50';
    }
    return 'text-blue-600 bg-blue-50';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('technologies', formData.technologies);
      fd.append('description', formData.description);
      fd.append('professor_email', formData.professorEmail);
      if (formData.problemStatement.trim()) fd.append('problem_statement', formData.problemStatement.trim());
      if (formData.objectives.trim()) fd.append('objectives', formData.objectives.trim());
      if (formData.methodology.trim()) fd.append('methodology', formData.methodology.trim());
      if (formData.expectedOutcomes.trim()) fd.append('expected_outcomes', formData.expectedOutcomes.trim());
      if (formData.deliverables.trim()) fd.append('deliverables', formData.deliverables.trim());
      uploadedFiles.forEach((file) => fd.append('files', file));
      const project = await api.postForm<{
        id: number;
        title: string;
        technologies: string;
        description: string;
        relevancyScore: number | null;
      }>('/projects', fd);
      onSubmit({ ...formData, id: project.id, relevancyScore: project.relevancyScore });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="student" onLogout={onLogout} onNavigate={() => {}} currentScreen="submit-idea" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-gray-900">Submit New Project Idea</h1>
                <p className="text-gray-600">Provide details about your proposed final year project</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="max-w-4xl">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Title */}
                <div>
                  <label htmlFor="title" className="block text-gray-900 mb-2">
                    Project Title *
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a descriptive title for your project"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1.5">
                    Choose a clear and concise title that reflects your project's purpose
                  </p>
                </div>

                {/* Technologies */}
                <div>
                  <label htmlFor="technologies" className="block text-gray-900 mb-2">
                    Technologies / Tools *
                  </label>
                  <input
                    id="technologies"
                    name="technologies"
                    type="text"
                    value={formData.technologies}
                    onChange={handleChange}
                    placeholder="e.g., Python, TensorFlow, React, MongoDB"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1.5">
                    List the programming languages, frameworks, and tools you plan to use (comma-separated)
                  </p>
                </div>

                {/* Professor Email */}
                <div>
                  <label htmlFor="professorEmail" className="block text-gray-900 mb-2">
                    Professor Email *
                  </label>
                  <input
                    id="professorEmail"
                    name="professorEmail"
                    type="email"
                    value={formData.professorEmail}
                    onChange={handleChange}
                    placeholder="professor@uol.edu.pk"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1.5">
                    Use your supervisor&apos;s registered UOL email (e.g. professor@uol.edu.pk). The professor must already have an account in this system.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-gray-900 mb-2">
                    Project Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={8}
                    placeholder="Provide a detailed description of your project including objectives, methodology, and expected outcomes..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1.5">
                    Describe the problem you're solving, your proposed solution, and the project's scope (minimum 100 words)
                  </p>
                </div>

                <ProposalFormFields values={formData} onChange={handleChange} />

                {/* File Upload */}
                <div>
                  <label className="block text-gray-900 mb-2">
                    Supporting Documents (Optional)
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer ${
                        dragActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                          <Upload className="w-6 h-6 text-gray-600" />
                        </div>
                        <p className="text-gray-900 mb-1">
                          Drop your files here, or <span className="text-blue-600">browse</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports: PDF, DOC, DOCX (Max 10MB each)
                        </p>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.doc"
                      />
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-sm text-gray-700 mb-2">
                          Uploaded Files ({uploadedFiles.length})
                        </div>
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileIcon(
                                  file.name
                                )}`}
                              >
                                <File className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-900">{file.name}</div>
                                <div className="text-xs text-gray-500">
                                  {formatFileSize(file.size)}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove file"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1.5">
                    Upload project proposals, research papers, or any supporting documentation
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <div className="text-blue-600 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-blue-900 mb-1">AI Relevancy Check</div>
                      <p className="text-sm text-blue-800">
                        After submission, our AI system will analyze your project idea and calculate a relevancy score
                        based on existing projects, current trends, and feasibility. You'll receive instant feedback.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}