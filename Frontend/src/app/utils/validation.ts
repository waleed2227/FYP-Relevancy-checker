/**
 * UOL registration validation (mirrors backend rules).
 */

const STUDENT_EMAIL = /^[0-9]{5,12}@student\.uol\.edu\.pk$/i;
const PROFESSOR_EMAIL = /^[a-zA-Z0-9._-]+@uol\.edu\.pk$/i;
const STUDENT_ID = /^[0-9]{5,12}$/;
const PK_PHONE = /^(?:\+92|0)?3[0-9]{9}$/;

export function normalizePakistaniPhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-()]/g, '').trim();
  let digits: string;
  if (cleaned.startsWith('+92')) digits = cleaned.slice(3);
  else if (cleaned.startsWith('92') && cleaned.length === 12) digits = cleaned.slice(2);
  else if (cleaned.startsWith('0')) digits = cleaned.slice(1);
  else digits = cleaned;
  if (!/^3[0-9]{9}$/.test(digits)) return null;
  return `+92${digits}`;
}

export function validateStudentEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!STUDENT_EMAIL.test(e)) {
    return 'Use UOL student email: 70140912@student.uol.edu.pk';
  }
  return null;
}

export function validateProfessorEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (e.includes('@student.')) {
    return 'Professors must use @uol.edu.pk, not @student.uol.edu.pk';
  }
  if (!PROFESSOR_EMAIL.test(e)) {
    return 'Use UOL professor email: name@uol.edu.pk';
  }
  return null;
}

export function validateStudentId(id: string): string | null {
  const s = id.trim();
  if (!STUDENT_ID.test(s)) {
    return 'Student ID must be numbers only (e.g. 70140912)';
  }
  return null;
}

export function validateEmailMatchesStudentId(email: string, studentId: string): string | null {
  const local = email.trim().toLowerCase().split('@')[0];
  if (local !== studentId.trim()) {
    return `Email must be ${studentId.trim()}@student.uol.edu.pk`;
  }
  return null;
}

export function validatePakistaniPhone(phone: string, required = false): string | null {
  if (!phone.trim()) {
    return required ? 'Phone number is required' : null;
  }
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (!PK_PHONE.test(cleaned)) {
    return 'Use Pakistani format: +923001234567 or 03001234567';
  }
  return null;
}

export function studentEmailFromId(studentId: string): string {
  return `${studentId.trim()}@student.uol.edu.pk`;
}
