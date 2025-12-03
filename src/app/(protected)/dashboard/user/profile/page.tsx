'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import StudentProfileForm from '@/components/student/StudentProfileForm';


type StudentProfile = {
  id: string;
  dateOfBirth: Date | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pinCode: string | null;
  educationLevel: string | null;
  institution: string | null;
  currentSemester: number | null;
  specialization: string | null;
  academicRecords: any;
  skills: string[];
  resumeUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ViewMode = 'view' | 'create' | 'edit';

export default function StudentProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; mobile: string | null } | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStudentProfile();
      fetchUserInfo();
    }
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.user);
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/student');
      
      if (response.status === 404) {
        // Profile doesn't exist yet
        setStudentProfile(null);
        setViewMode('create');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch student profile');
      }

      const data = await response.json();
      setStudentProfile(data.student);
      setViewMode('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching student profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (formData: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create profile');
      }

      const data = await response.json();
      setStudentProfile(data.profile);
      setViewMode('view');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
      console.error('Error creating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (formData: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/student', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();
      setStudentProfile(data.profile);
      setViewMode('view');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (studentProfile) {
      setViewMode('view');
    } else {
      setViewMode('create');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd MMM yyyy');
  };

  const renderSection = (title: string, content: React.ReactNode) => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
        {title}
      </h3>
      <div className="space-y-4">
        {content}
      </div>
    </div>
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {viewMode === 'create' ? 'Create Student Profile' : 'Edit Student Profile'}
            </h1>
            <p className="text-gray-600 mt-2">
              {viewMode === 'create' 
                ? 'Complete your student profile to get started'
                : 'Update your student profile information'
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <StudentProfileForm
            initialData={viewMode === 'edit' ? studentProfile : null}
            userInfo={userInfo}
            onSubmit={viewMode === 'create' ? handleCreateProfile : handleUpdateProfile}
            onCancel={handleCancel}
            loading={loading}
            mode={viewMode}
          />
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Welcome, {session?.user?.name}!
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't created your student profile yet. Please complete your profile to access all features.
            </p>
          </div>
          <button
            onClick={() => setViewMode('create')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
          >
            Create Student Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with User Info */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Student Profile
              </h1>
              <p className="text-gray-600 mt-2">
                View and manage your academic and professional information
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        {renderSection('Personal Information', (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Date of Birth
              </label>
              <p className="mt-1 text-gray-900">
                {formatDate(studentProfile.dateOfBirth)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Gender
              </label>
              <p className="mt-1 text-gray-900">
                {studentProfile.gender || 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Country
              </label>
              <p className="mt-1 text-gray-900">
                {studentProfile.country}
              </p>
            </div>
          </div>
        ))}

        {/* Contact Information */}
        {renderSection('Contact Information', (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500">
                Address
              </label>
              <p className="mt-1 text-gray-900">
                {studentProfile.address || 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                City
              </label>
              <p className="mt-1 text-gray-900">
                {studentProfile.city || 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                State
              </label>
              <p className="mt-1 text-gray-900">
                {studentProfile.state || 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                PIN Code
              </label>
              <p className="mt-1 text-gray-900">
                {studentProfile.pinCode || 'N/A'}
              </p>
            </div>
          </div>
        ))}

        {/* Academic Information */}
        {renderSection('Academic Information', (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Education Level
              </label>
              <p className="mt-1 text-gray-900">
                {studentProfile.educationLevel || 'N/A'}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500">
                Institution
              </label>
              <p className="mt-1 text-gray-900">
                {studentProfile.institution || 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Current Semester
              </label>
              <p className="mt-1 text-gray-900">
                {studentProfile.currentSemester || 'N/A'}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500">
                Specialization
              </label>
              <p className="mt-1 text-gray-900">
                {studentProfile.specialization || 'N/A'}
              </p>
            </div>
          </div>
        ))}

        {/* Skills */}
        {studentProfile.skills && studentProfile.skills.length > 0 && renderSection('Skills', (
          <div>
            <div className="flex flex-wrap gap-2">
              {studentProfile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Professional Links */}
        {renderSection('Professional Links', (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {studentProfile.linkedinUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  LinkedIn
                </label>
                <a
                  href={studentProfile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {studentProfile.linkedinUrl}
                </a>
              </div>
            )}
            {studentProfile.githubUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  GitHub
                </label>
                <a
                  href={studentProfile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {studentProfile.githubUrl}
                </a>
              </div>
            )}
            {studentProfile.resumeUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Resume
                </label>
                <a
                  href={studentProfile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Download Resume
                </a>
              </div>
            )}
          </div>
        ))}

        {/* Timeline */}
        {renderSection('Timeline', (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Created At
              </label>
              <p className="mt-1 text-gray-900">
                {formatDate(studentProfile.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Last Updated
              </label>
              <p className="mt-1 text-gray-900">
                {formatDate(studentProfile.updatedAt)}
              </p>
            </div>
          </div>
        ))}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200"
          >
            Print Profile
          </button>
          <button
            onClick={() => setViewMode('edit')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}