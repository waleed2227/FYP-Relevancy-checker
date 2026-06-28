import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import {
  createAdminUser,
  fetchAdminDepartments,
  type AdminCreateUserPayload,
} from '../services/adminService';
import { ApiError, parseApiErrorDetail } from '../services/api';
import {
  normalizePakistaniPhone,
  studentEmailFromId,
  validateEmailMatchesStudentId,
  validatePakistaniPhone,
  validateProfessorEmail,
  validateStudentEmail,
  validateStudentId,
} from '../utils/validation';

type UserRole = 'student' | 'professor' | 'admin';

interface AdminCreateUserModalProps {
  open: boolean;
  onClose: () => void;
  fixedRole?: UserRole;
  showRoleSelect?: boolean;
  title: string;
  onCreated: (message: string) => void;
}

const EMPTY_FORM = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  studentId: '',
  department: '',
  phoneNumber: '',
  specialization: '',
  role: 'student' as UserRole,
};

export default function AdminCreateUserModal({
  open,
  onClose,
  fixedRole,
  showRoleSelect = false,
  title,
  onCreated,
}: AdminCreateUserModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [departments, setDepartments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);

  const role = fixedRole ?? form.role;

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY_FORM, role: fixedRole ?? 'student' });
    setErrors({});
    setSubmitError(null);
    setLoadingDepts(true);
    fetchAdminDepartments()
      .then((rows) => setDepartments(rows.map((d) => d.name)))
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));
  }, [open, fixedRole]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };

    if (name === 'studentId' && role === 'student' && /^\d*$/.test(value)) {
      next.studentId = value;
      if (value.length >= 5) {
        next.email = studentEmailFromId(value);
      }
    }

    if (name === 'role') {
      next.role = value as UserRole;
    }

    setForm(next);
    setErrors((prev) => {
      const updated = { ...prev, [name]: '' };
      delete updated.submit;
      return updated;
    });
    setSubmitError(null);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (role === 'student') {
      const err = validateStudentEmail(form.email);
      if (err) next.email = err;
      else if (form.studentId.trim()) {
        const matchErr = validateEmailMatchesStudentId(form.email, form.studentId);
        if (matchErr) next.email = matchErr;
      }
    } else {
      const err = validateProfessorEmail(form.email);
      if (err) next.email = err;
    }

    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';

    if (role === 'student') {
      if (!form.studentId.trim()) next.studentId = 'Student ID is required';
      else {
        const sidErr = validateStudentId(form.studentId);
        if (sidErr) next.studentId = sidErr;
      }
    }

    if (role === 'professor' && !form.department.trim()) {
      next.department = 'Department is required';
    }

    if (form.phoneNumber.trim()) {
      const phoneErr = validatePakistaniPhone(form.phoneNumber);
      if (phoneErr) next.phoneNumber = phoneErr;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitError(null);
    try {
      const payload: AdminCreateUserPayload = {
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role,
        student_id: role === 'student' ? form.studentId.trim() : undefined,
        department:
          role === 'professor' || (role === 'student' && form.department.trim())
            ? form.department.trim() || undefined
            : undefined,
        phone_number: form.phoneNumber.trim()
          ? normalizePakistaniPhone(form.phoneNumber) || undefined
          : undefined,
        specialization:
          role === 'professor' && form.specialization.trim()
            ? form.specialization.trim()
            : undefined,
      };

      const created = await createAdminUser(payload);
      onCreated(`${created.name} (${created.role}) was created successfully.`);
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to create user.';
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              {submitError}
            </div>
          )}

          {showRoleSelect && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="student">Student</option>
                <option value="professor">Professor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
          </div>

          {role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student ID</label>
              <input
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
                placeholder="70140912"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.studentId && <p className="text-xs text-red-600 mt-1">{errors.studentId}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              readOnly={role === 'student' && form.studentId.length >= 5}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          {(role === 'professor' || role === 'student') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department {role === 'professor' ? '(required)' : '(optional)'}
              </label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                disabled={loadingDepts}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{role === 'professor' ? 'Select department' : 'None'}</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department}</p>}
            </div>
          )}

          {role === 'professor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Specialization
              </label>
              <input
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                placeholder="e.g. AI & Machine Learning"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone (optional)</label>
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="03001234567"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {errors.phoneNumber && <p className="text-xs text-red-600 mt-1">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm password</label>
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
