'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

type StudentProfileFormProps = {
  initialData: any;
  userInfo: { name: string; email: string; mobile: string | null } | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  mode: 'create' | 'edit';
};

type FormData = {
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  educationLevel: string;
  institution: string;
  currentSemester: number | string;
  specialization: string;
  skills: string;
  linkedinUrl: string;
  githubUrl: string;
  resumeUrl: string;
};

export default function StudentProfileForm({
  initialData,
  userInfo,
  onSubmit,
  onCancel,
  loading,
  mode,
}: StudentProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: initialData
      ? {
          dateOfBirth: initialData.dateOfBirth
            ? new Date(initialData.dateOfBirth).toISOString().split('T')[0]
            : '',
          gender: initialData.gender || '',
          address: initialData.address || '',
          city: initialData.city || '',
          state: initialData.state || '',
          country: initialData.country || 'India',
          pinCode: initialData.pinCode || '',
          educationLevel: initialData.educationLevel || '',
          institution: initialData.institution || '',
          currentSemester: initialData.currentSemester || '',
          specialization: initialData.specialization || '',
          skills: initialData.skills?.join(', ') || '',
          linkedinUrl: initialData.linkedinUrl || '',
          githubUrl: initialData.githubUrl || '',
          resumeUrl: initialData.resumeUrl || '',
        }
      : {
          country: 'India',
        },
  });

  const handleFormSubmit = (data: FormData) => {
    const formattedData = {
      ...data,
      dateOfBirth: data.dateOfBirth || null,
      currentSemester: data.currentSemester ? parseInt(data.currentSemester as string) : null,
      skills: data.skills
        ? data.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
        : [],
    };
    onSubmit(formattedData);
  };

  return (
    <div className="w-full mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Single Main Card */}

          {/* Account Info (Top Section) */}
          {userInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-8">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-700">Name</span>
                  <p className="mt-1 text-gray-800">{userInfo.name}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Email</span>
                  <p className="mt-1 text-gray-800">{userInfo.email}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Mobile</span>
                  <p className="mt-1 text-gray-800">{userInfo.mobile || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Section: Personal Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-5 pb-2 border-b border-gray-200">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  {...register('gender')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Contact Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-5 pb-2 border-b border-gray-200">
              Contact Information
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="Enter your full address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    {...register('city')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    {...register('state')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    {...register('country')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>
              <div className="md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  {...register('pinCode', {
                    pattern: { value: /^[0-9]{6}$/, message: 'Invalid PIN code (must be 6 digits)' },
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="6-digit PIN code"
                />
                {errors.pinCode && <p className="mt-1 text-sm text-red-600">{errors.pinCode.message}</p>}
              </div>
            </div>
          </div>

          {/* Section: Academic Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-5 pb-2 border-b border-gray-200">
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                <select
                  {...register('educationLevel')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                >
                  <option value="">Select Education Level</option>
                  <option value="HIGH_SCHOOL">High School</option>
                  <option value="DIPLOMA">Diploma</option>
                  <option value="BACHELORS">Bachelor's Degree</option>
                  <option value="MASTERS">Master's Degree</option>
                  <option value="PHD">PhD</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <input
                  type="text"
                  {...register('institution')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="Enter institution name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Semester</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  {...register('currentSemester')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="e.g., 4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input
                  type="text"
                  {...register('specialization')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>
          </div>

          {/* Section: Skills */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-5 pb-2 border-b border-gray-200">
              Skills
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                {...register('skills')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                placeholder="e.g., JavaScript, React, Node.js, Python"
              />
              <p className="mt-2 text-sm text-gray-500">Enter skills separated by commas</p>
            </div>
          </div>

          {/* Section: Professional Links */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-5 pb-2 border-b border-gray-200">
              Professional Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  {...register('linkedinUrl', {
                    pattern: { value: /^https?:\/\/(www\.)?linkedin\.com\/.*/, message: 'Invalid LinkedIn URL' },
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="https://linkedin.com/in/username"
                />
                {errors.linkedinUrl && <p className="mt-1 text-sm text-red-600">{errors.linkedinUrl.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                <input
                  type="url"
                  {...register('githubUrl', {
                    pattern: { value: /^https?:\/\/(www\.)?github\.com\/.*/, message: 'Invalid GitHub URL' },
                  })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="https://github.com/username"
                />
                {errors.githubUrl && <p className="mt-1 text-sm text-red-600">{errors.githubUrl.message}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume URL</label>
                <input
                  type="url"
                  {...register('resumeUrl')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  placeholder="https://your-resume-link.com"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Upload your resume to cloud storage and paste the shareable link
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Profile' : 'Update Profile'
              )}
            </button>
          </div>
        
      </form>
    </div>
  );
}