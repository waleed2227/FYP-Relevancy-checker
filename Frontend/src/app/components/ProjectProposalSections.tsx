import React from 'react';
import { FileText } from 'lucide-react';

export interface ProposalFields {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  targetIndustry?: string | null;
  problemStatement?: string | null;
  currentChallenges?: string | null;
  existingSolutions?: string | null;
  existingSolutionLimitations?: string | null;
  proposedSolution?: string | null;
  projectScope?: string | null;
  uniqueFeatures?: string | null;
  innovationAspect?: string | null;
  competitiveAdvantage?: string | null;
  marketGap?: string | null;
  primaryTargetUsers?: string | null;
  secondaryTargetUsers?: string | null;
  aiTechnologiesUsed?: string | null;
  technicalFeasibility?: string | null;
  financialFeasibility?: string | null;
  operationalFeasibility?: string | null;
  expectedImpact?: string | null;
  academicImpact?: string | null;
  businessImpact?: string | null;
  socialImpact?: string | null;
  futureEnhancements?: string | null;
  scalabilityOpportunities?: string | null;
  commercializationPotential?: string | null;
  privacyConcerns?: string | null;
  securityConcerns?: string | null;
  ethicalConsiderations?: string | null;
  futureScope?: string | null;
  riskAssessment?: string | null;
  /** @deprecated legacy API alias */
  targetUsers?: string | null;
}

export const PROJECT_CATEGORIES = [
  'Web Application',
  'Mobile Application',
  'Artificial Intelligence / ML',
  'Internet of Things',
  'Blockchain',
  'Cybersecurity',
  'Data Science & Analytics',
  'Cloud Computing',
  'Game Development',
  'Other',
] as const;

export const AI_TECH_OPTIONS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Generative AI',
  'Internet of Things',
  'Blockchain',
] as const;

export function displayProposalValue(value?: string | null): string {
  return value?.trim() ? value.trim() : 'Not Provided';
}

const DISPLAY_SECTIONS: {
  title: string;
  fields: { key: keyof ProposalFields; label: string }[];
}[] = [
  {
    title: 'Section 1: Project Overview',
    fields: [
      { key: 'category', label: 'Category' },
      { key: 'targetIndustry', label: 'Target Industry' },
    ],
  },
  {
    title: 'Section 2: Problem Analysis',
    fields: [
      { key: 'problemStatement', label: 'Problem Statement' },
      { key: 'currentChallenges', label: 'Current Challenges' },
      { key: 'existingSolutions', label: 'Existing Solutions' },
      { key: 'existingSolutionLimitations', label: 'Limitations of Existing Solutions' },
    ],
  },
  {
    title: 'Section 3: Proposed Solution',
    fields: [
      { key: 'proposedSolution', label: 'Proposed Solution' },
      { key: 'projectScope', label: 'Project Scope' },
    ],
  },
  {
    title: 'Section 4: Innovation & Uniqueness',
    fields: [
      { key: 'uniqueFeatures', label: 'Unique Features' },
      { key: 'innovationAspect', label: 'Innovation Aspect' },
      { key: 'competitiveAdvantage', label: 'Competitive Advantage' },
      { key: 'marketGap', label: 'Market Gap' },
    ],
  },
  {
    title: 'Section 5: Target Users',
    fields: [
      { key: 'primaryTargetUsers', label: 'Primary Target Users' },
      { key: 'secondaryTargetUsers', label: 'Secondary Target Users' },
    ],
  },
  {
    title: 'Section 6: AI & Emerging Technologies',
    fields: [{ key: 'aiTechnologiesUsed', label: 'Selected Technologies' }],
  },
  {
    title: 'Section 7: Feasibility Analysis',
    fields: [
      { key: 'technicalFeasibility', label: 'Technical Feasibility' },
      { key: 'financialFeasibility', label: 'Financial Feasibility' },
      { key: 'operationalFeasibility', label: 'Operational Feasibility' },
    ],
  },
  {
    title: 'Section 8: Expected Impact',
    fields: [
      { key: 'expectedImpact', label: 'Expected Impact' },
      { key: 'academicImpact', label: 'Academic Impact' },
      { key: 'businessImpact', label: 'Business Impact' },
      { key: 'socialImpact', label: 'Social Impact' },
    ],
  },
  {
    title: 'Section 9: Future Scope',
    fields: [
      { key: 'futureEnhancements', label: 'Future Enhancements' },
      { key: 'scalabilityOpportunities', label: 'Scalability Opportunities' },
      { key: 'commercializationPotential', label: 'Commercialization Potential' },
    ],
  },
  {
    title: 'Section 10: Ethics & Risk Assessment',
    fields: [
      { key: 'privacyConcerns', label: 'Privacy Concerns' },
      { key: 'securityConcerns', label: 'Security Concerns' },
      { key: 'ethicalConsiderations', label: 'Ethical Considerations' },
    ],
  },
];

function resolveDisplayValue(project: ProposalFields, key: keyof ProposalFields): string | null | undefined {
  if (key === 'primaryTargetUsers') {
    return project.primaryTargetUsers ?? project.targetUsers;
  }
  if (key === 'futureEnhancements') {
    return project.futureEnhancements ?? project.futureScope;
  }
  return project[key];
}

interface ProjectProposalSectionsProps {
  project: ProposalFields;
  showOverview?: boolean;
  className?: string;
}

export default function ProjectProposalSections({
  project,
  showOverview = true,
  className = '',
}: ProjectProposalSectionsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {showOverview && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Project Overview</h4>
          </div>
          {project.title && (
            <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
              <span className="font-medium">Title:</span> {project.title}
            </p>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">
            <span className="font-medium">Description:</span> {displayProposalValue(project.description)}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Category:</span>{' '}
              {displayProposalValue(project.category)}
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Target Industry:</span>{' '}
              {displayProposalValue(project.targetIndustry)}
            </div>
          </div>
        </div>
      )}

      {DISPLAY_SECTIONS.map((section) => (
        <div key={section.title} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</h4>
          </div>
          <div className="p-4 grid grid-cols-1 gap-3">
            {section.fields.map(({ key, label }) => (
              <div key={key} className="p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {displayProposalValue(resolveDisplayValue(project, key))}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const PROPOSAL_FORM_DEFAULTS = {
  category: '',
  targetIndustry: '',
  problemStatement: '',
  currentChallenges: '',
  existingSolutions: '',
  existingSolutionLimitations: '',
  proposedSolution: '',
  projectScope: '',
  uniqueFeatures: '',
  innovationAspect: '',
  competitiveAdvantage: '',
  marketGap: '',
  primaryTargetUsers: '',
  secondaryTargetUsers: '',
  aiTechnologiesUsed: '',
  technicalFeasibility: '',
  financialFeasibility: '',
  operationalFeasibility: '',
  expectedImpact: '',
  academicImpact: '',
  businessImpact: '',
  socialImpact: '',
  futureEnhancements: '',
  scalabilityOpportunities: '',
  commercializationPotential: '',
  privacyConcerns: '',
  securityConcerns: '',
  ethicalConsiderations: '',
};

export type ProposalFormValues = typeof PROPOSAL_FORM_DEFAULTS;

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-5 space-y-4 bg-white dark:bg-gray-900/40">{children}</div>
    </div>
  );
}

function TextAreaField({
  name,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
  error,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && ' *'}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
          error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
        }`}
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
}

interface ProposalFormFieldsProps {
  values: ProposalFormValues;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onAiTechToggle: (tech: string) => void;
  selectedAiTech: Set<string>;
  showSection1?: boolean;
  section1Fields?: React.ReactNode;
  fieldErrors?: Record<string, string>;
}

export function ProposalFormFields({
  values,
  onChange,
  onAiTechToggle,
  selectedAiTech,
  showSection1 = false,
  section1Fields,
  fieldErrors = {},
}: ProposalFormFieldsProps) {
  const err = (key: string) => fieldErrors[key];
  return (
    <div className="space-y-6">
      {showSection1 && section1Fields}

      <FormSection title="Section 2: Problem Analysis">
        <TextAreaField name="problemStatement" label="Problem Statement" value={values.problemStatement} onChange={onChange} placeholder="Clearly define the problem your FYP aims to solve..." required error={err('problemStatement')} />
        <TextAreaField name="currentChallenges" label="Current Challenges" value={values.currentChallenges} onChange={onChange} placeholder="Describe challenges faced in this domain today..." />
        <TextAreaField name="existingSolutions" label="Existing Solutions" value={values.existingSolutions} onChange={onChange} placeholder="What solutions currently exist?" required error={err('existingSolutions')} />
        <TextAreaField name="existingSolutionLimitations" label="Limitations of Existing Solutions" value={values.existingSolutionLimitations} onChange={onChange} placeholder="What are the gaps or weaknesses in current solutions?" />
      </FormSection>

      <FormSection title="Section 3: Proposed Solution">
        <TextAreaField name="proposedSolution" label="Proposed Solution" value={values.proposedSolution} onChange={onChange} placeholder="Describe your proposed approach and solution..." rows={4} required error={err('proposedSolution')} />
        <TextAreaField name="projectScope" label="Project Scope" value={values.projectScope} onChange={onChange} placeholder="Define boundaries, deliverables, and what is in/out of scope..." required error={err('projectScope')} />
      </FormSection>

      <FormSection title="Section 4: Innovation & Uniqueness">
        <TextAreaField name="uniqueFeatures" label="Unique Features" value={values.uniqueFeatures} onChange={onChange} placeholder="What unique features will your project offer?" required error={err('uniqueFeatures')} />
        <TextAreaField name="innovationAspect" label="Innovation Aspect" value={values.innovationAspect} onChange={onChange} placeholder="How is your project innovative?" required error={err('innovationAspect')} />
        <TextAreaField name="competitiveAdvantage" label="Competitive Advantage" value={values.competitiveAdvantage} onChange={onChange} placeholder="What advantage does your solution have over alternatives?" />
        <TextAreaField name="marketGap" label="Market Gap" value={values.marketGap} onChange={onChange} placeholder="What market or research gap does this address?" />
      </FormSection>

      <FormSection title="Section 5: Target Users">
        <TextAreaField name="primaryTargetUsers" label="Primary Target Users" value={values.primaryTargetUsers} onChange={onChange} placeholder="Who are the main beneficiaries of your project?" required error={err('primaryTargetUsers')} />
        <TextAreaField name="secondaryTargetUsers" label="Secondary Target Users" value={values.secondaryTargetUsers} onChange={onChange} placeholder="Any secondary user groups?" />
      </FormSection>

      <FormSection title="Section 6: AI & Emerging Technologies">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Select all technologies relevant to your project:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AI_TECH_OPTIONS.map((tech) => (
            <label
              key={tech}
              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <input
                type="checkbox"
                checked={selectedAiTech.has(tech)}
                onChange={() => onAiTechToggle(tech)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">{tech}</span>
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection title="Section 7: Feasibility Analysis">
        <TextAreaField name="technicalFeasibility" label="Technical Feasibility" value={values.technicalFeasibility} onChange={onChange} placeholder="Is the project technically achievable with available skills and tools?" />
        <TextAreaField name="financialFeasibility" label="Financial Feasibility" value={values.financialFeasibility} onChange={onChange} placeholder="Estimated costs, resources, and budget considerations..." />
        <TextAreaField name="operationalFeasibility" label="Operational Feasibility" value={values.operationalFeasibility} onChange={onChange} placeholder="Can this be deployed and maintained in practice?" />
      </FormSection>

      <FormSection title="Section 8: Expected Impact">
        <TextAreaField name="expectedImpact" label="Expected Impact" value={values.expectedImpact} onChange={onChange} placeholder="Overall expected impact of your project..." required error={err('expectedImpact')} />
        <TextAreaField name="academicImpact" label="Academic Impact (Objectives)" value={values.academicImpact} onChange={onChange} placeholder="Contribution to academic knowledge or learning outcomes..." required error={err('academicImpact')} />
        <TextAreaField name="businessImpact" label="Business Impact" value={values.businessImpact} onChange={onChange} placeholder="Potential business or commercial value..." />
        <TextAreaField name="socialImpact" label="Social Impact" value={values.socialImpact} onChange={onChange} placeholder="Benefits to society or community..." />
      </FormSection>

      <FormSection title="Section 9: Future Scope">
        <TextAreaField name="futureEnhancements" label="Future Enhancements" value={values.futureEnhancements} onChange={onChange} placeholder="Possible future improvements and extensions..." />
        <TextAreaField name="scalabilityOpportunities" label="Scalability Opportunities" value={values.scalabilityOpportunities} onChange={onChange} placeholder="How can the solution scale?" />
        <TextAreaField name="commercializationPotential" label="Commercialization Potential" value={values.commercializationPotential} onChange={onChange} placeholder="Potential for commercialization or startup..." />
      </FormSection>

      <FormSection title="Section 10: Ethics & Risk Assessment">
        <TextAreaField name="privacyConcerns" label="Privacy Concerns" value={values.privacyConcerns} onChange={onChange} placeholder="Data privacy risks and mitigation..." />
        <TextAreaField name="securityConcerns" label="Security Concerns" value={values.securityConcerns} onChange={onChange} placeholder="Security risks and safeguards..." />
        <TextAreaField name="ethicalConsiderations" label="Ethical Considerations" value={values.ethicalConsiderations} onChange={onChange} placeholder="Ethical implications and responsible use..." />
      </FormSection>
    </div>
  );
}

export function parseAiTechnologies(value?: string | null): Set<string> {
  if (!value?.trim()) return new Set();
  return new Set(value.split(',').map((s) => s.trim()).filter(Boolean));
}

export function serializeAiTechnologies(selected: Set<string>): string {
  return Array.from(selected).join(', ');
}

export function proposalFieldsToApiPayload(values: ProposalFormValues): Record<string, string | null> {
  return {
    category: values.category.trim() || null,
    target_industry: values.targetIndustry.trim() || null,
    problem_statement: values.problemStatement.trim() || null,
    current_challenges: values.currentChallenges.trim() || null,
    existing_solutions: values.existingSolutions.trim() || null,
    existing_solution_limitations: values.existingSolutionLimitations.trim() || null,
    proposed_solution: values.proposedSolution.trim() || null,
    project_scope: values.projectScope.trim() || null,
    unique_features: values.uniqueFeatures.trim() || null,
    innovation_aspect: values.innovationAspect.trim() || null,
    competitive_advantage: values.competitiveAdvantage.trim() || null,
    market_gap: values.marketGap.trim() || null,
    target_users: values.primaryTargetUsers.trim() || null,
    secondary_target_users: values.secondaryTargetUsers.trim() || null,
    ai_technologies_used: values.aiTechnologiesUsed.trim() || null,
    technical_feasibility: values.technicalFeasibility.trim() || null,
    financial_feasibility: values.financialFeasibility.trim() || null,
    operational_feasibility: values.operationalFeasibility.trim() || null,
    expected_impact: values.expectedImpact.trim() || null,
    academic_impact: values.academicImpact.trim() || null,
    business_impact: values.businessImpact.trim() || null,
    social_impact: values.socialImpact.trim() || null,
    future_enhancements: values.futureEnhancements.trim() || null,
    scalability_opportunities: values.scalabilityOpportunities.trim() || null,
    commercialization_potential: values.commercializationPotential.trim() || null,
    privacy_concerns: values.privacyConcerns.trim() || null,
    security_concerns: values.securityConcerns.trim() || null,
    ethical_considerations: values.ethicalConsiderations.trim() || null,
  };
}

export function proposalFieldsFromProject(project: ProposalFields): ProposalFormValues {
  const aiTech = project.aiTechnologiesUsed || '';
  return {
    category: project.category || '',
    targetIndustry: project.targetIndustry || '',
    problemStatement: project.problemStatement || '',
    currentChallenges: project.currentChallenges || '',
    existingSolutions: project.existingSolutions || '',
    existingSolutionLimitations: project.existingSolutionLimitations || '',
    proposedSolution: project.proposedSolution || '',
    projectScope: project.projectScope || '',
    uniqueFeatures: project.uniqueFeatures || '',
    innovationAspect: project.innovationAspect || '',
    competitiveAdvantage: project.competitiveAdvantage || '',
    marketGap: project.marketGap || '',
    primaryTargetUsers: project.primaryTargetUsers || project.targetUsers || '',
    secondaryTargetUsers: project.secondaryTargetUsers || '',
    aiTechnologiesUsed: aiTech,
    technicalFeasibility: project.technicalFeasibility || '',
    financialFeasibility: project.financialFeasibility || '',
    operationalFeasibility: project.operationalFeasibility || '',
    expectedImpact: project.expectedImpact || '',
    academicImpact: project.academicImpact || '',
    businessImpact: project.businessImpact || '',
    socialImpact: project.socialImpact || '',
    futureEnhancements: project.futureEnhancements || project.futureScope || '',
    scalabilityOpportunities: project.scalabilityOpportunities || '',
    commercializationPotential: project.commercializationPotential || '',
    privacyConcerns: project.privacyConcerns || '',
    securityConcerns: project.securityConcerns || '',
    ethicalConsiderations: project.ethicalConsiderations || '',
  };
}
