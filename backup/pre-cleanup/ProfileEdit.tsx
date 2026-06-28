import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { User, Mail, Phone, Camera, Save, X } from 'lucide-react';

interface ProfileEditProps {
  role: 'student' | 'professor';
  onLogout: () => void;
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export default function ProfileEdit({ role, onLogout, onBack, onNavigate }: ProfileEditProps) {
  const [formData, setFormData] = useState({
    name: role === 'student' ? 'Alex Johnson' : 'Dr. Sarah Smith',
    email: role === 'student' ? 'alex.johnson@student.university.edu' : 'sarah.smith@university.edu',
    phone: role === 'student' ? '+1 (555) 789-0123' : '+1 (555) 901-2345',
    id: role === 'student' ? 'STU2025025' : 'PROF12345',
    department: role === 'professor' ? 'Computer Science' : '',
    major: role === 'student' ? 'Computer Science' : '',
    year: role === 'student' ? '4th Year' : '',
    photo: role === 'student'
      ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop'
      : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop',
  });

  const [previewPhoto, setPreviewPhoto] = useState(formData.photo);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result as string);
        setFormData((prev) => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    alert('Profile updated successfully!');
    onBack();
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role={role} onLogout={onLogout} onNavigate={onNavigate} currentScreen="profile" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
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

          <div className="max-w-3xl">
            {/* Profile Photo Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-gray-900 dark:text-white font-semibold mb-4">Profile Photo</h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {previewPhoto ? (
                    <img
                      src={previewPhoto}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
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
                    JPG, PNG or GIF. Max size 5MB. Recommended 400x400px.
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
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
                    {role === 'student' ? 'Student ID' : 'Professor ID'}{' '}
                    <span className="text-red-500">*</span>
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
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
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
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Major <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="major"
                        value={formData.major}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                        Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
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

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={onBack}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
