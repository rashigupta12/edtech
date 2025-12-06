'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Mail, Phone, Calendar, Building } from 'lucide-react';

interface CollegeDetails {
  id: string;
  collegeName: string;
  collegeCode: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CollegeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const collegeId = params.id as string;
  
  const [college, setCollege] = useState<CollegeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
useEffect(() => {
  const fetchCollegeDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/colleges?id=${collegeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch college details');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setCollege(data.data);
      } else {
        throw new Error('College not found');
      }
    } catch (err) {
      console.error('Error fetching college:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (collegeId) {
    fetchCollegeDetails();
  }
}, [collegeId]); // Now only depends on collegeId

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      APPROVED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
      SUSPENDED: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100'
        }`}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading college details</h3>
                <p className="text-sm text-red-600 mt-1">{error || 'College not found'}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.back()}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded text-sm font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/admin/colleges"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Colleges
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{college.collegeName}</h1>
              <p className="text-gray-600 mt-2">College details and information</p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(college.status)}
            </div>
          </div>
        </div>

        {/* College Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* College Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-8 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{college.collegeName}</h2>
                <p className="text-gray-600 mt-1">College Code: {college.collegeCode}</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-2" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 mt-1">{college.contactEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-gray-900 mt-1 flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      {college.contactPhone || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                  Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900 mt-1">{college.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">City</label>
                      <p className="text-gray-900 mt-1">{college.city}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">State</label>
                      <p className="text-gray-900 mt-1">{college.state}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">PIN Code</label>
                    <p className="text-gray-900 mt-1">{college.pinCode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {(college.createdAt || college.updatedAt) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {college.createdAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created Date</label>
                      <p className="text-gray-900 mt-1">{formatDate(college.createdAt)}</p>
                    </div>
                  )}
                  {college.updatedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="text-gray-900 mt-1">{formatDate(college.updatedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <Link
                href={`/dashboard/admin/colleges/${college.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Edit College
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}