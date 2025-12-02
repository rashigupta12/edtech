'use client';

import { useCurrentUser } from '@/hooks/auth';
import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface CollegeData {
  id: string;
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
  logo: string | null;
  banner: string | null;
  about: string;
  verificationDocument: string | null;
  additionalDocuments: string | null;
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
  ifscCode: string;
  status: string;
}

const CollegeProfile = () => {
  const user = useCurrentUser();
  const userid = user?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [collegeDetail, setCollegeDetail] = useState<CollegeData | null>(null);
  const [originalData, setOriginalData] = useState<CollegeData | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<CollegeData>>({});

  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const [additionalDocs, setAdditionalDocs] = useState<File[]>([]);

  // Previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollegeDetail = async () => {
      if (!userid) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/colleges?userId=${userid}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });

        const response = await res.json();
        if (response.success && response.data) {
          const data = response.data;
          setCollegeDetail(data);
          setOriginalData(data);

          // Initialize form data
          setFormData({
            collegeName: data.collegeName || '',
            collegeCode: data.collegeCode || '',
            registrationNumber: data.registrationNumber || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || 'India',
            pinCode: data.pinCode || '',
            websiteUrl: data.websiteUrl || '',
            contactEmail: data.contactEmail || '',
            contactPhone: data.contactPhone || '',
            about: data.about || '',
            bankAccountNumber: data.bankAccountNumber || '',
            bankName: data.bankName || '',
            accountHolderName: data.accountHolderName || '',
            ifscCode: data.ifscCode || '',
          });

          setLogoPreview(data.logo || null);
          setBannerPreview(data.banner || null);
        }
      } catch (err) {
        console.error('Failed to fetch college:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load college profile' });
      } finally {
        setLoading(false);
      }
    };

    if (userid) fetchCollegeDetail();
  }, [userid]);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    setLogoFile(null);
    setBannerFile(null);
    setVerificationDoc(null);
    setAdditionalDocs([]);
    setLogoPreview(collegeDetail?.logo || null);
    setBannerPreview(collegeDetail?.banner || null);
    if (originalData) {
      setFormData({
        collegeName: originalData.collegeName || '',
        collegeCode: originalData.collegeCode || '',
        registrationNumber: originalData.registrationNumber || '',
        address: originalData.address || '',
        city: originalData.city || '',
        state: originalData.state || '',
        country: originalData.country || 'India',
        pinCode: originalData.pinCode || '',
        websiteUrl: originalData.websiteUrl || '',
        contactEmail: originalData.contactEmail || '',
        contactPhone: originalData.contactPhone || '',
        about: originalData.about || '',
        bankAccountNumber: originalData.bankAccountNumber || '',
        bankName: originalData.bankName || '',
        accountHolderName: originalData.accountHolderName || '',
        ifscCode: originalData.ifscCode || '',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner' | 'verification' | 'additional') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else if (type === 'banner') {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    } else if (type === 'verification') {
      setVerificationDoc(file);
    } else if (type === 'additional') {
      setAdditionalDocs(Array.from(e.target.files || []));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeDetail?.id) return;

    setSaving(true);
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value || '');
    });

    if (logoFile) data.append('logo', logoFile);
    if (bannerFile) data.append('banner', bannerFile);
    if (verificationDoc) data.append('verificationDocument', verificationDoc);
    additionalDocs.forEach(file => data.append('additionalDocuments', file));

    try {
      const res = await fetch(`/api/colleges/${collegeDetail.id}`, {
        method: 'PUT',
        body: data,
      });

      const result = await res.json();

      if (result.success) {
        setCollegeDetail(result.data);
        setOriginalData(result.data);
        setIsEditing(false);
        setLogoFile(null);
        setBannerFile(null);
        setVerificationDoc(null);
        setAdditionalDocs([]);
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'College profile updated successfully',
          timer: 2000,
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Failed', text: result.message || 'Update failed' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong!' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl font-medium">Loading college profile...</div>
      </div>
    );
  }

  if (!collegeDetail) {
    return (
      <div className="text-center text-red-600 text-2xl mt-20">
        No college profile found.
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto p-6 bg-white shadow-xl rounded-xl">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-4xl font-bold text-indigo-700">College Profile</h1>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="collegeForm"
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-70 transition shadow-md"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <form id="collegeForm" onSubmit={handleSubmit} className="space-y-10">

        {/* Basic Information */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'College Name', name: 'collegeName', required: true },
              { label: 'College Code', name: 'collegeCode', required: true },
              { label: 'Registration Number', name: 'registrationNumber' },
              { label: 'Contact Email', name: 'contactEmail', type: 'email', required: true },
              { label: 'Contact Phone', name: 'contactPhone', required: true },
              { label: 'Website URL', name: 'websiteUrl', type: 'url' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                {isEditing ? (
                  <input
                    type={field.type || 'text'}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData] || ''}
                    onChange={handleInputChange}
                    required={field.required}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                ) : (
                  <p className="text-lg font-medium text-gray-900">
                    {collegeDetail[field.name as keyof CollegeData] || '-'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Address */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Address</h2>
          {isEditing ? (
            <>
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                rows={3}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Full Address"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {['city', 'state', 'pinCode', 'country'].map(field => (
                  <input
                    key={field}
                    type="text"
                    name={field}
                    value={formData[field as keyof typeof formData] || ''}
                    onChange={handleInputChange}
                    required
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-lg font-medium">{collegeDetail.address}</p>
              <p className="text-gray-700 mt-2">
                {collegeDetail.city}, {collegeDetail.state} - {collegeDetail.pinCode}
              </p>
              <p className="text-gray-700">{collegeDetail.country}</p>
            </div>
          )}
        </section>

        {/* About */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">About College</h2>
          {isEditing ? (
            <textarea
              name="about"
              value={formData.about || ''}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {collegeDetail.about || 'No description provided.'}
            </p>
          )}
        </section>

        {/* Images */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">College Logo</h3>
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'logo')}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
            )}
            {logoPreview && (
              <img
                src={logoPreview}
                alt="College Logo"
                className="mt-4 w-48 h-48 object-contain border-4 border-gray-200 rounded-xl shadow-lg"
              />
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Banner Image</h3>
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'banner')}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
            )}
            {bannerPreview && (
              <img
                src={bannerPreview}
                alt="Banner"
                className="mt-4 w-full h-64 object-cover rounded-xl shadow-lg"
              />
            )}
          </div>
        </section>

        {/* Documents */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Document</label>
              {isEditing ? (
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'verification')}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-700 file:text-white"
                />
              ) : (
                <p className="text-gray-600">
                  {collegeDetail.verificationDocument ? 'Uploaded' : 'Not uploaded'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Documents</label>
              {isEditing ? (
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileChange(e, 'additional')}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-700 file:text-white"
                />
              ) : (
                <p className="text-gray-600">
                  {additionalDocs.length > 0 ? `${additionalDocs.length} file(s)` : 'None uploaded'}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Bank Details */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">Bank Details (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Bank Name', name: 'bankName' },
              { label: 'Account Holder Name', name: 'accountHolderName' },
              { label: 'Account Number', name: 'bankAccountNumber' },
              { label: 'IFSC Code', name: 'ifscCode' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                {isEditing ? (
                  <input
                    type="text"
                    name={field.name}
                    value={formData[field.name as keyof typeof formData] || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-lg text-gray-900">
                    {collegeDetail[field.name as keyof CollegeData] || '-'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

      </form>
    </div>
  );
};

export default CollegeProfile;