import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { User, Mail, Phone, Camera, Save, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/profileService';
import { ApiError, parseApiErrorDetail } from '../services/api';
import { compressProfilePhoto } from '../utils/profilePhoto';

interface ProfileEditProps {
  role: 'student' | 'professor';
  onLogout: () => void;
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function ProfileEdit({ role, onLogout, onBack, onNavigate }: ProfileEditProps) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    id: '',
    department: '',
    major: '',
    year: '',
    photo: '' as string,
  });

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await refreshUser();
      } catch (err) {
        const message =
          err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to load profile.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    const idLabel =
      role === 'student'
        ? user.student_id || '—'
        : user.employee_id || String(user.id);
    setFormData({
      name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      id: idLabel,
      department: user.department || '',
      major: user.major || user.department || '',
      year: user.year || '',
      photo: user.photo_url || '',
    });
    setPreviewPhoto(user.photo_url || null);
  }, [user, role]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const compressed = await compressProfilePhoto(file);
      setPreviewPhoto(compressed);
      setFormData((prev) => ({ ...prev, photo: compressed }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process image.';
      setError(message);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const payload =
        role === 'student'
          ? {
              full_name: formData.name,
              phone: formData.phone || undefined,
              photo_url: formData.photo || undefined,
              major: formData.major || undefined,
              year: formData.year || undefined,
            }
          : {
              full_name: formData.name,
              phone: formData.phone || undefined,
              photo_url: formData.photo || undefined,
              department: formData.department || undefined,
            };
      await updateProfile(payload);
      await refreshUser();
      setSuccessMessage('Profile saved to the database.');
    } catch (err) {
      const message =
        err instanceof ApiError ? parseApiErrorDetail(err.detail ?? err.message) : 'Failed to save profile.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role={role} onLogout={onLogout} onNavigate={onNavigate} currentScreen="profile" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-gray-900 dark:text-white mb-2">Edit Profile</h1>
              <p className="text-gray-600 dark:text-gray-400">Update your personal information and profile photo</p>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-3 py-8 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading profile...</span>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {!loading && (
          <div className="max-w-3xl">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-gray-900 dark:text-white font-semibold mb-4">Profile Photo</h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {previewPhoto ? (
                    <img
                      src={previewPhoto}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-gray-200 dark:border-gray-600">
                      <User className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-full cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    <Camera className="w-5 h-5" />
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <div className="text-gray-900 dark:text-white mb-1 font-medium">Upload a new photo</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    JPG or PNG, automatically resized for upload (max 400×400).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-gray-900 dark:text-white font-semibold mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {role === 'student' ? 'Student ID' : 'Professor ID'}
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {role === 'student' ? (
                  <>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Major / Department</label>
                      <input
                        type="text"
                        name="major"
                        value={formData.major}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Year</label>
                      <input
                        type="text"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        placeholder="e.g. 4th Year"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-4">
              <button
                onClick={onBack}
                disabled={saving}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
