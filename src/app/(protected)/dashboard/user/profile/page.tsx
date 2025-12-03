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
        setStudentProfile(null);
        setViewMode('create');
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch student profile');

      const data = await response.json();
      setStudentProfile(data.student);
      setViewMode('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (formData: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create profile');
      }

      const data = await response.json();
      setStudentProfile(data.profile);
      setViewMode('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (formData: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/student', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();
      setStudentProfile(data.profile);
      setViewMode('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setViewMode(studentProfile ? 'view' : 'create');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not provided';
    return format(new Date(date), 'dd MMM yyyy');
  };

  // Loading State
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
      </div>
    );
  }

  // Create / Edit Mode → Use the green form
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {viewMode === 'create' ? 'Create Your Profile' : 'Edit Profile'}
            </h1>
            <p className="text-gray-600 mt-2">
              {viewMode === 'create'
                ? 'Complete your student profile to unlock all features'
                : 'Keep your information up to date'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">{error}</p>
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

  // No Profile Yet → Welcome Screen
  if (!studentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H9a2 2 0 01-2-2v-1a6 6 0 1112 0v1a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome, {session?.user?.name}!
          </h2>
          <p className="text-gray-600 mb-8">
            Complete your student profile to get personalized opportunities and access all features.
          </p>
          <button
            onClick={() => setViewMode('create')}
            className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition shadow-md"
          >
            Create Your Profile
          </button>
        </div>
      </div>
    );
  }

  // View Mode → Single Clean Green-Accented Card
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 ">
        {/* Header */}
        {/* <div className="mb-8 text-center md:text-left ">
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-600 mt-2">All your academic and professional details in one place</p>
        </div> */}

        {/* Main Profile Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* User Header */}
          <div className="bg-green-50 border border-green-200  p-6">
            <div className="flex flex-col md:flex-row items-center gap-5">
              <div className="w-20 h-20 bg-white/100 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold">{session?.user?.name}</h2>
                <p className="opacity-90">{session?.user?.email}</p>
                {studentProfile.institution && (
                  <p className="text-sm mt-1 opacity-80">
                    {studentProfile.institution} • {studentProfile.specialization || 'Student'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Personal Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div>
                  <span className="text-gray-500">Date of Birth</span>
                  <p className="font-medium text-gray-900">{formatDate(studentProfile.dateOfBirth)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Gender</span>
                  <p className="font-medium text-gray-900">{studentProfile.gender || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Contact & Location</h3>
              <div className="space-y-3 text-sm">
                {studentProfile.address && (
                  <div>
                    <span className="text-gray-500">Address</span>
                    <p className="font-medium text-gray-900">{studentProfile.address}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-gray-500">City</span>
                    <p className="font-medium">{studentProfile.city || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">State</span>
                    <p className="font-medium">{studentProfile.state || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">PIN</span>
                    <p className="font-medium">{studentProfile.pinCode || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Country</span>
                    <p className="font-medium">{studentProfile.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Academic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div>
                  <span className="text-gray-500">Education Level</span>
                  <p className="font-medium text-gray-900">{studentProfile.educationLevel || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Current Semester</span>
                  <p className="font-medium text-gray-900">{studentProfile.currentSemester || '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500">Institution</span>
                  <p className="font-medium text-gray-900">{studentProfile.institution || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500">Specialization</span>
                  <p className="font-medium text-gray-900">{studentProfile.specialization || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Skills */}
            {studentProfile.skills && studentProfile.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {studentProfile.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {(studentProfile.linkedinUrl || studentProfile.githubUrl || studentProfile.resumeUrl) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Professional Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
                  {studentProfile.linkedinUrl && (
                    <a href={studentProfile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                       className="text-green-600 hover:text-green-700 underline">
                      LinkedIn Profile
                    </a>
                  )}
                  {studentProfile.githubUrl && (
                    <a href={studentProfile.githubUrl} target="_blank" rel="noopener noreferrer"
                       className="text-green-600 hover:text-green-700 underline">
                      GitHub Profile
                    </a>
                  )}
                  {studentProfile.resumeUrl && (
                    <a href={studentProfile.resumeUrl} target="_blank" rel="noopener noreferrer"
                       className="text-green-600 hover:text-green-700 underline font-medium">
                      View Resume
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            {/* <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Created: {formatDate(studentProfile.createdAt)}</span>
                <span>Updated: {formatDate(studentProfile.updatedAt)}</span>
              </div>
            </div> */}
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-5 border-t border-gray-200 flex justify-end gap-3">
          
            <button
              onClick={() => setViewMode('edit')}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}