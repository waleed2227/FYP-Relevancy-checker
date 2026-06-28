import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import {
  fetchAdminDepartments,
  updateAdminProfessor,
  type AdminUpdateProfessorPayload,
  type ProfessorListItem,
} from '../services/adminService';
import { ApiError, parseApiErrorDetail } from '../services/api';
import {
  normalizePakistaniPhone,
  validatePakistaniPhone,
  validateProfessorEmail,
} from '../utils/validation';

interface AdminEditProfessorModalProps {
  professor: ProfessorListItem;
  open: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function AdminEditProfessorModal({
  professor,
  open,
  onClose,
  onSaved,
}: AdminEditProfessorModalProps) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    department: '',
    phoneNumber: '',
    specialization: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      fullName: professor.name,
      email: professor.email,
      department: professor.department === 'N/A' ? '' : professor.department,
      phoneNumber: professor.phone || '',
      specialization: professor.specialization || '',
      status: professor.status as 'active' | 'inactive',
    });
    setErrors({});
    setSubmitError(null);
    fetchAdminDepartments()
      .then((rows) => setDepartments(rows.map((d) => d.name)))
      .catch(() => setDepartments([]));
  }, [open, professor]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setSubmitError(null);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else {
      const err = validateProfessorEmail(form.email);
      if (err) next.email = err;
    }
    if (!form.department.trim()) next.department = 'Department is required';
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
      const payload: AdminUpdateProfessorPayload = {
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department.trim(),
        phone_number: form.phoneNumber.trim()
          ? normalizePakistaniPhone(form.phoneNumber) || undefined
          : undefined,
        specialization: form.specialization.trim() || undefined,
        status: form.status,
      };
      await updateAdminProfessor(professor.id, payload);
      onSaved(`${form.fullName.trim()} was updated successfully.`);
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to update professor.';
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Professor</h2>
          <button type="button" onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="p-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              {submitError}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
              {form.department && !departments.includes(form.department) && (
                <option value={form.department}>{form.department}</option>
              )}
            </select>
            {errors.department && <p className="text-xs text-red-600 mt-1">{errors.department}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization</label>
            <input
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
