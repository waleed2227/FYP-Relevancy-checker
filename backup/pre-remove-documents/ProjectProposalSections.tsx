import React from 'react';
import { FileText } from 'lucide-react';

export interface ProposalFields {
  problemStatement?: string | null;
  objectives?: string | null;
  methodology?: string | null;
  expectedOutcomes?: string | null;
  deliverables?: string | null;
  description?: string | null;
}

export function displayProposalValue(value?: string | null): string {
  return value?.trim() ? value.trim() : 'Not Provided';
}

const SECTIONS: { key: keyof ProposalFields; label: string }[] = [
  { key: 'problemStatement', label: 'Problem Statement' },
  { key: 'objectives', label: 'Objectives' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'expectedOutcomes', label: 'Expected Outcomes' },
  { key: 'deliverables', label: 'Deliverables' },
];

interface ProjectProposalSectionsProps {
  project: ProposalFields;
  showDescription?: boolean;
  className?: string;
}

export default function ProjectProposalSections({
  project,
  showDescription = true,
  className = '',
}: ProjectProposalSectionsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {showDescription && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Project Description</div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {displayProposalValue(project.description)}
          </p>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Proposal Details</h4>
        <div className="grid grid-cols-1 gap-4">
          {SECTIONS.map(({ key, label }) => (
            <div
              key={key}
              className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {displayProposalValue(project[key])}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const PROPOSAL_FORM_DEFAULTS = {
  problemStatement: '',
  objectives: '',
  methodology: '',
  expectedOutcomes: '',
  deliverables: '',
};

interface ProposalFormFieldsProps {
  values: typeof PROPOSAL_FORM_DEFAULTS;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function ProposalFormFields({ values, onChange }: ProposalFormFieldsProps) {
  const fields: { name: keyof typeof PROPOSAL_FORM_DEFAULTS; label: string; placeholder: string; rows?: number }[] = [
    {
      name: 'problemStatement',
      label: 'Problem Statement',
      placeholder: 'Describe the problem your project aims to solve...',
      rows: 3,
    },
    {
      name: 'objectives',
      label: 'Objectives',
      placeholder: 'List the main objectives of your project...',
      rows: 3,
    },
    {
      name: 'methodology',
      label: 'Methodology',
      placeholder: 'Explain your approach, tools, and methods...',
      rows: 3,
    },
    {
      name: 'expectedOutcomes',
      label: 'Expected Outcomes',
      placeholder: 'What results or impact do you expect?',
      rows: 3,
    },
    {
      name: 'deliverables',
      label: 'Deliverables',
      placeholder: 'Software, reports, prototypes, etc.',
      rows: 2,
    },
  ];

  return (
    <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Proposal Details</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Optional structured fields. Leave blank if not applicable.
      </p>
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {field.label}
          </label>
          <textarea
            name={field.name}
            value={values[field.name]}
            onChange={onChange}
            rows={field.rows ?? 3}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </div>
      ))}
    </div>
  );
}
