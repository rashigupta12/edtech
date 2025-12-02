'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

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

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStudentProfile();
    }
  }, [session]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student?id=${session?.user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch student profile');
      }

      const data = await response.json();
      setStudentProfile(data.student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching student profile:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={fetchStudentProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            No Student Profile Found
          </h2>
          <p className="text-gray-500 mb-6">
            Please complete your student profile setup.
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Student Profile
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage your academic and professional information
          </p>
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
                  className="mt-1 text-blue-600 hover:text-blue-800 hover:underline"
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
                  className="mt-1 text-blue-600 hover:text-blue-800 hover:underline"
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
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Print Profile
          </button>
          <button
            onClick={() => {/* Add edit functionality */}}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}