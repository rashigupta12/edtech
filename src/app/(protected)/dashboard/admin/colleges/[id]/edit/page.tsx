/*eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface CollegeFormData {
  id?: string;
  collegeName: string;
  collegeCode: string;
  registrationNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  websiteUrl: string;
  contactEmail: string;
  contactPhone: string;
  about: string;
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
  ifscCode: string;
  createdBy?: string;
}

interface FormErrors {
  collegeName?: string;
  collegeCode?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export default function EditCollegePage() {
  const router = useRouter();
  const params = useParams();
  const collegeId = params.id as string;
  const user = useCurrentUser();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CollegeFormData>({
    collegeName: '',
    collegeCode: '',
    registrationNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
    websiteUrl: '',
    contactEmail: '',
    contactPhone: '',
    about: '',
    bankAccountNumber: '',
    bankName: '',
    accountHolderName: '',
    ifscCode: '',
    createdBy: user?.id || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch college data on component mount
  useEffect(() => {
    if (collegeId) {
      fetchCollegeData();
    }
  }, [collegeId]);

  const fetchCollegeData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/colleges?id=${collegeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch college data');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const college = data.data;
        setFormData({
          id: college.id,
          collegeName: college.collegeName || '',
          collegeCode: college.collegeCode || '',
          registrationNumber: college.registrationNumber || '',
          address: college.address || '',
          city: college.city || '',
          state: college.state || '',
          country: college.country || 'India',
          pinCode: college.pinCode || '',
          websiteUrl: college.websiteUrl || '',
          contactEmail: college.contactEmail || '',
          contactPhone: college.contactPhone || '',
          about: college.about || '',
          bankAccountNumber: college.bankAccountNumber || '',
          bankName: college.bankName || '',
          accountHolderName: college.accountHolderName || '',
          ifscCode: college.ifscCode || '',
          createdBy: college.createdBy || user?.id || '',
        });
      } else {
        throw new Error('College not found');
      }
    } catch (err) {
      console.error('Error fetching college:', err);
      setError(err instanceof Error ? err.message : 'Failed to load college data');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validation
    if (!formData.collegeName.trim()) {
      newErrors.collegeName = 'College name is required';
    }

    if (!formData.collegeCode.trim()) {
      newErrors.collegeCode = 'College code is required';
    } else if (formData.collegeCode.length > 10) {
      newErrors.collegeCode = 'College code must be 10 characters or less';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pinCode.trim()) {
      newErrors.pinCode = 'PIN code is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!isValidEmail(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/colleges/${collegeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update college');
      }

      // Redirect to colleges list on success
      router.push('/dashboard/admin/colleges');
      router.refresh();
      
    } catch (err: any) {
      setError(err.message || 'Something went wrong while updating the college');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="w-full mx-auto">
          <Link
            href="/dashboard/admin/colleges"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Colleges
          </Link>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-full mx-auto">
        <Link
          href="/dashboard/admin/colleges"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Colleges
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit College</h1>
          <p className="text-gray-600 mt-2">
            Update the college information below.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <div className="px-4 py-6 sm:p-8">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              
              {/* College Basic Information */}
              <div className="sm:col-span-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="collegeName" className="block text-sm font-medium leading-6 text-gray-900">
                  College Name *
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="collegeName"
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                      errors.collegeName ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'
                    }`}
                  />
                  {errors.collegeName && (
                    <p className="mt-2 text-sm text-red-600">{errors.collegeName}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="collegeCode" className="block text-sm font-medium leading-6 text-gray-900">
                  College Code *
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="collegeCode"
                    name="collegeCode"
                    value={formData.collegeCode}
                    onChange={handleInputChange}
                    maxLength={10}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                      errors.collegeCode ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'
                    }`}
                  />
                  {errors.collegeCode && (
                    <p className="mt-2 text-sm text-red-600">{errors.collegeCode}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="registrationNumber" className="block text-sm font-medium leading-6 text-gray-900">
                  Registration Number
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="registrationNumber"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="sm:col-span-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
                  Address *
                </label>
                <div className="mt-2">
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                      errors.address ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-2 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="city" className="block text-sm font-medium leading-6 text-gray-900">
                  City *
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                      errors.city ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'
                    }`}
                  />
                  {errors.city && (
                    <p className="mt-2 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="state" className="block text-sm font-medium leading-6 text-gray-900">
                  State *
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                      errors.state ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'
                    }`}
                  />
                  {errors.state && (
                    <p className="mt-2 text-sm text-red-600">{errors.state}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="country" className="block text-sm font-medium leading-6 text-gray-900">
                  Country *
                </label>
                <div className="mt-2">
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  >
                    <option value="India">India</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="pinCode" className="block text-sm font-medium leading-6 text-gray-900">
                  PIN Code *
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="pinCode"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                      errors.pinCode ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'
                    }`}
                  />
                  {errors.pinCode && (
                    <p className="mt-2 text-sm text-red-600">{errors.pinCode}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="contactEmail" className="block text-sm font-medium leading-6 text-gray-900">
                  Contact Email *
                </label>
                <div className="mt-2">
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                      errors.contactEmail ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'
                    }`}
                  />
                  {errors.contactEmail && (
                    <p className="mt-2 text-sm text-red-600">{errors.contactEmail}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="contactPhone" className="block text-sm font-medium leading-6 text-gray-900">
                  Contact Phone *
                </label>
                <div className="mt-2">
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                      errors.contactPhone ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'
                    }`}
                  />
                  {errors.contactPhone && (
                    <p className="mt-2 text-sm text-red-600">{errors.contactPhone}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="websiteUrl" className="block text-sm font-medium leading-6 text-gray-900">
                  Website URL
                </label>
                <div className="mt-2">
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="sm:col-span-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="about" className="block text-sm font-medium leading-6 text-gray-900">
                  About College
                </label>
                <div className="mt-2">
                  <textarea
                    id="about"
                    name="about"
                    rows={4}
                    value={formData.about}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="sm:col-span-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Details (Optional)</h2>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="bankName" className="block text-sm font-medium leading-6 text-gray-900">
                  Bank Name
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="accountHolderName" className="block text-sm font-medium leading-6 text-gray-900">
                  Account Holder Name
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="accountHolderName"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="bankAccountNumber" className="block text-sm font-medium leading-6 text-gray-900">
                  Account Number
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="bankAccountNumber"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="ifscCode" className="block text-sm font-medium leading-6 text-gray-900">
                  IFSC Code
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="ifscCode"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update College'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}