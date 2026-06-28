import React, { useState } from 'react';
import { GraduationCap, UserCircle, ArrowLeft } from 'lucide-react';
import { register as apiRegister } from '../services/authService';
import { ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  normalizePakistaniPhone,
  studentEmailFromId,
  validateEmailMatchesStudentId,
  validatePakistaniPhone,
  validateProfessorEmail,
  validateStudentEmail,
  validateStudentId,
} from '../utils/validation';

interface RegistrationProps {
  onRegister: (role: 'student' | 'professor') => void;
  onBackToLogin: () => void;
}

export default function Registration({ onRegister, onBackToLogin }: RegistrationProps) {
  const { login: setAuth } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'professor'>('student');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    department: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };

    if (name === 'studentId' && selectedRole === 'student' && /^\d*$/.test(value)) {
      next.studentId = value;
      if (value.length >= 5) {
        next.email = studentEmailFromId(value);
      }
    }

    setFormData(next);
    if (errors[name] || errors.submit) {
      setErrors((prev) => {
        const u = { ...prev, [name]: '' };
        delete u.submit;
        return u;
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (selectedRole === 'student') {
      const err = validateStudentEmail(formData.email);
      if (err) newErrors.email = err;
      else if (formData.studentId.trim()) {
        const matchErr = validateEmailMatchesStudentId(formData.email, formData.studentId);
        if (matchErr) newErrors.email = matchErr;
      }
    } else {
      const err = validateProfessorEmail(formData.email);
      if (err) newErrors.email = err;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (selectedRole === 'student') {
      if (!formData.studentId.trim()) {
        newErrors.studentId = 'Student ID is required';
      } else {
        const sidErr = validateStudentId(formData.studentId);
        if (sidErr) newErrors.studentId = sidErr;
      }
    }

    if (selectedRole === 'professor' && !formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (formData.phoneNumber.trim()) {
      const phoneErr = validatePakistaniPhone(formData.phoneNumber);
      if (phoneErr) newErrors.phoneNumber = phoneErr;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const phone = formData.phoneNumber.trim()
        ? normalizePakistaniPhone(formData.phoneNumber) || undefined
        : undefined;

      const user = await apiRegister({
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: selectedRole,
        student_id: selectedRole === 'student' ? formData.studentId.trim() : undefined,
        department: selectedRole === 'professor' ? formData.department.trim() : undefined,
        phone_number: phone,
      });
      setAuth(selectedRole, user);
      onRegister(selectedRole);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: 'student' as const,
      label: 'Student',
      icon: GraduationCap,
      description: 'Register as a student to submit project ideas',
    },
    {
      id: 'professor' as const,
      label: 'Professor',
      icon: UserCircle,
      description: 'Register as a professor to review proposals',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 p-4 transition-colors">
      <div className="w-full max-w-5xl">
        <button
          onClick={onBackToLogin}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Login
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-gray-900 dark:text-white mb-2 text-3xl font-bold">Create Your Account</h1>
          <p className="text-gray-600 dark:text-gray-400">Join the AI-Based Project Relevancy System</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Role Selection */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 p-8 border-r border-gray-200 dark:border-gray-700">
              <h2 className="text-gray-900 dark:text-white mb-6 font-semibold">Select Your Role</h2>
              <div className="space-y-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left group ${
                        selectedRole === role.id
                          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-lg'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg transition-all ${
                            selectedRole === role.id
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-md'
                              : 'bg-gray-200 dark:bg-gray-600 group-hover:bg-gray-300 dark:group-hover:bg-gray-500'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              selectedRole === role.id ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-gray-900 dark:text-white mb-1 font-medium">{role.label}</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{role.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-sm text-blue-900 dark:text-blue-300 mb-2 font-semibold">Registration Benefits:</p>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• AI-powered project analysis</li>
                  <li>• Real-time collaboration</li>
                  <li>• Secure document management</li>
                  <li>• Email notifications</li>
                </ul>
              </div>
            </div>

            {/* Registration Form */}
            <div className="p-8 bg-white dark:bg-gray-800">
              <h2 className="text-gray-900 dark:text-white mb-6 font-semibold">Registration Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.fullName ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={
                      selectedRole === 'student'
                        ? '70140912@student.uol.edu.pk'
                        : 'professor@uol.edu.pk'
                    }
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.email && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>}
                </div>

                {/* Role-specific field */}
                {selectedRole === 'student' ? (
                  <div>
                    <label htmlFor="studentId" className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                      Student ID *
                    </label>
                    <input
                      id="studentId"
                      name="studentId"
                      type="text"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder="e.g., 70140912 (numbers only)"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.studentId ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.studentId && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.studentId}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="department" className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                      Department *
                    </label>
                    <input
                      id="department"
                      name="department"
                      type="text"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g., Computer Science"
                      className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                        errors.department ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.department && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.department}</p>
                    )}
                  </div>
                )}

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+923001234567 or 03001234567"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.phoneNumber ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.password ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.confirmPassword ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start gap-2">
                  <input
                    id="terms"
                    type="checkbox"
                    required
                    className="w-4 h-4 mt-1 border-gray-300 dark:border-gray-600 rounded text-blue-600 dark:text-blue-500 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Submit Button */}
                {errors.submit && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-xl font-medium disabled:opacity-60"
                >
                  {loading ? 'Creating account...' : `Create Account as ${roles.find((r) => r.id === selectedRole)?.label}`}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <button
                    onClick={onBackToLogin}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          © 2025 University Final Year Project System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
