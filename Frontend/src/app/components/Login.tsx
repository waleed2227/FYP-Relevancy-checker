import React, { useState } from 'react';
import { GraduationCap, UserCircle, Sparkles, Shield } from 'lucide-react';
import { login as apiLogin } from '../services/authService';
import { ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onLogin: (role: 'student' | 'professor' | 'admin') => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

export default function Login({ onLogin, onRegister, onForgotPassword }: LoginProps) {
  const { login: setAuth } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'professor' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await apiLogin({ email, password, role: selectedRole });
      setAuth(user.role as 'student' | 'professor' | 'admin', user);
      onLogin(user.role as 'student' | 'professor' | 'admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Check backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      id: 'student' as const,
      label: 'Student',
      icon: GraduationCap,
      description: 'Submit and track AI-powered project ideas',
    },
    {
      id: 'professor' as const,
      label: 'Professor',
      icon: UserCircle,
      description: 'Review and approve project proposals with AI insights',
    },
    {
      id: 'admin' as const,
      label: 'Administrator',
      icon: Shield,
      description: 'Manage system and oversee AI relevancy analysis',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 p-4 transition-colors">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-gray-900 dark:text-white mb-2 text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI-Based Project Relevancy System
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Final Year Project Intelligence Platform</p>
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
            </div>

            {/* Login Form */}
            <div className="p-8 bg-white dark:bg-gray-800">
              <h2 className="text-gray-900 dark:text-white mb-6 font-semibold">Sign In</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'student'
                        ? '70140912@student.uol.edu.pk'
                        : selectedRole === 'professor'
                        ? 'name@uol.edu.pk'
                        : 'admin@uol.edu.pk'
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm text-gray-700 dark:text-gray-300 mb-2 font-medium">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 border-gray-300 dark:border-gray-600 rounded text-blue-600 dark:text-blue-500 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                    />
                    <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-xl font-medium disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : `Sign In as ${roles.find((r) => r.id === selectedRole)?.label}`}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <button
                    onClick={onRegister}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    Register Now
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