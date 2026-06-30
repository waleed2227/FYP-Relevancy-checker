/**
 * Proposal form validation (mirrors backend/app/utils/proposal_validators.py).
 */

const PLACEHOLDERS = new Set([
  'not provided',
  'n/a',
  'na',
  '-',
  'none',
  'null',
  'tbd',
  'todo',
]);

export type ProposalValidationErrors = Record<string, string>;

const RULES: { key: string; min: number; label: string }[] = [
  { key: 'title', min: 10, label: 'Title' },
  { key: 'description', min: 100, label: 'Description' },
  { key: 'problemStatement', min: 80, label: 'Problem Statement' },
  { key: 'proposedSolution', min: 80, label: 'Proposed Solution' },
  { key: 'academicImpact', min: 50, label: 'Academic Impact (Objectives)' },
  { key: 'existingSolutions', min: 50, label: 'Existing Solutions' },
  { key: 'projectScope', min: 50, label: 'Project Scope' },
  { key: 'targetIndustry', min: 3, label: 'Target Industry' },
  { key: 'primaryTargetUsers', min: 20, label: 'Primary Target Users' },
  { key: 'expectedImpact', min: 40, label: 'Expected Impact' },
  { key: 'innovationAspect', min: 40, label: 'Innovation Aspect' },
  { key: 'uniqueFeatures', min: 40, label: 'Unique Features' },
];

function isPlaceholder(s: string): boolean {
  return PLACEHOLDERS.has(s.trim().toLowerCase());
}

function checkText(value: string | undefined, min: number, label: string): string | null {
  const t = (value ?? '').trim();
  if (!t) return `${label} is required.`;
  if (isPlaceholder(t)) return `${label} cannot be "${t}". Provide a real description.`;
  if (t.length < min) return `${label} must contain at least ${min} meaningful characters.`;
  return null;
}

export function validateTechnologies(value: string | undefined): string | null {
  const t = (value ?? '').trim();
  if (!t || isPlaceholder(t)) {
    return 'Technologies must list at least one technology (e.g. Python, React).';
  }
  const tokens = t
    .split(/[,;|/]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => !isPlaceholder(x));
  if (!tokens.length) {
    return 'Technologies must list at least one technology (e.g. Python, React).';
  }
  return null;
}

export function validateProfessorEmail(value: string | undefined): string | null {
  const t = (value ?? '').trim();
  if (!t) return 'Professor email is required.';
  return null;
}

export function validateProposalForm(values: {
  title: string;
  description: string;
  technologies: string;
  professorEmail?: string;
} & Record<string, string>): ProposalValidationErrors {
  const errors: ProposalValidationErrors = {};
  for (const { key, min, label } of RULES) {
    const msg = checkText(values[key], min, label);
    if (msg) errors[key] = msg;
  }
  const techErr = validateTechnologies(values.technologies);
  if (techErr) errors.technologies = techErr;
  const profErr = validateProfessorEmail(values.professorEmail);
  if (profErr) errors.professorEmail = profErr;
  return errors;
}
