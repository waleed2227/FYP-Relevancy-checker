import { api } from './api';

export interface DashboardActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  occurredAt: string;
  color: string;
}

export interface DashboardDepartmentItem {
  department: string;
  projects: number;
  students: number;
  professors: number;
  percentage: number;
}

export interface DuplicateProjectSummary {
  id: number;
  title: string;
  studentName: string;
  technologies: string;
  description: string;
  status: string;
  submittedDate: string;
}

export interface DuplicateAlertItem {
  id: number;
  project1: DuplicateProjectSummary;
  project2: DuplicateProjectSummary;
  similarity: number;
  riskLevel: string;
  status: string;
  detectedDate: string;
  aiAnalysis?: string | null;
  recommendation?: string | null;
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalProfessors: number;
  submittedProjects: number;
  approvedProjects: number;
  rejectedProjects: number;
  aiDuplicateAlerts: number;
  recentActivities: DashboardActivityItem[];
  departmentBreakdown: DashboardDepartmentItem[];
  duplicateAlerts: DuplicateAlertItem[];
}

export function fetchDuplicateReportDetail(reportId: number) {
  return api.get<DuplicateAlertItem>(`/admin/duplicate-reports/${reportId}`);
}

export interface UserListItem {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  joinedDate: string;
  projectsCount: number;
}

export interface StudentListItem {
  id: number;
  name: string;
  email: string;
  studentId: string;
  department: string;
  status: string;
  projectsCount: number;
  joinedDate: string;
}

export interface ProfessorListItem {
  id: number;
  name: string;
  email: string;
  department: string;
  status: string;
  projectsSupervised: number;
  joinedDate: string;
  phone?: string | null;
  photoUrl?: string | null;
  professorId?: string | null;
  specialization?: string | null;
}

export interface ProfessorStats {
  totalProfessors: number;
  activeProfessors: number;
  totalSupervisedProjects: number;
  averageRating: number;
}

export interface ProfessorProjectItem {
  id: number;
  title: string;
  studentName: string;
  status: string;
  submittedDate: string;
  relevancyScore?: number | null;
}

export interface ProfessorReviewHistoryItem {
  id: number;
  projectTitle: string;
  studentName: string;
  action: string;
  feedback: string;
  createdAt: string;
}

export interface ProfessorDetail {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  professorId?: string | null;
  department: string;
  specialization?: string | null;
  status: string;
  joinedDate: string;
  projectsSupervised: number;
  assignedProjects: ProfessorProjectItem[];
  reviewHistory: ProfessorReviewHistoryItem[];
}

export interface AdminUpdateProfessorPayload {
  full_name?: string;
  email?: string;
  department?: string;
  phone_number?: string;
  specialization?: string;
  status?: 'active' | 'inactive';
}

export interface DepartmentListItem {
  id: number;
  name: string;
  code?: string | null;
  studentCount: number;
  professorCount: number;
  projectCount: number;
}

export interface AdminCreateUserPayload {
  full_name: string;
  email: string;
  password: string;
  role: 'student' | 'professor' | 'admin';
  student_id?: string;
  department?: string;
  phone_number?: string;
  specialization?: string;
}

export function fetchAdminDashboard() {
  return api.get<AdminDashboardStats>('/admin/dashboard');
}

export function fetchAdminUsers() {
  return api.get<UserListItem[]>('/admin/users');
}

export function fetchAdminStudents() {
  return api.get<StudentListItem[]>('/admin/students');
}

export function fetchAdminProfessors() {
  return api.get<ProfessorListItem[]>('/admin/professors');
}

export function fetchAdminProfessorStats() {
  return api.get<ProfessorStats>('/admin/professors/stats');
}

export function fetchAdminProfessorDetail(professorId: number) {
  return api.get<ProfessorDetail>(`/admin/professors/${professorId}`);
}

export function updateAdminProfessor(professorId: number, payload: AdminUpdateProfessorPayload) {
  return api.patch<ProfessorListItem>(`/admin/professors/${professorId}`, payload);
}

export function deleteAdminProfessor(professorId: number) {
  return api.delete(`/admin/professors/${professorId}`);
}

export function fetchAdminDepartments() {
  return api.get<DepartmentListItem[]>('/admin/departments');
}

export function createAdminUser(payload: AdminCreateUserPayload) {
  return api.post<UserListItem>('/admin/users', payload);
}
