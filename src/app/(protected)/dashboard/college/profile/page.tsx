"use client";

import { useCurrentUser } from "@/hooks/auth";
import {
  AlertCircle,
  Banknote,
  BookOpen,
  Building2,
  CheckCircle,
  CreditCard,
  Edit3,
  Eye,
  File,
  Globe,
  Hash,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Shield,
  Trash2,
  Upload,
  User,
  X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

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
  additionalDocuments: string[] | null;
  bankAccountNumber: string;
  bankName: string;
  accountHolderName: string;
  ifscCode: string;
  status: string;
}

interface AdditionalDocument {
  id: string;
  name: string;
  url: string;
  type: string;
}

const CollegeProfile = () => {
  const user = useCurrentUser();
  const userid = user?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState<{
    logo: boolean;
    banner: boolean;
    verification: boolean;
    additional: boolean;
  }>({
    logo: false,
    banner: false,
    verification: false,
    additional: false,
  });

  const [collegeDetail, setCollegeDetail] = useState<CollegeData | null>(null);
  const [originalData, setOriginalData] = useState<CollegeData | null>(null);
  const [formData, setFormData] = useState<Partial<CollegeData>>({});
  const [additionalDocs, setAdditionalDocs] = useState<AdditionalDocument[]>(
    []
  );

  useEffect(() => {
    const fetchCollegeDetail = async () => {
      if (!userid) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/colleges?userId=${userid}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        const response = await res.json();
        if (response.success && response.data) {
          const data = response.data;
          setCollegeDetail(data);
          setOriginalData(data);

          // Parse additional documents
          if (data.additionalDocuments) {
            try {
              const parsedDocs = Array.isArray(data.additionalDocuments)
                ? data.additionalDocuments.map(
                    (doc: string, index: number) => ({
                      id: `doc-${index}`,
                      name: doc.split("/").pop() || `Document ${index + 1}`,
                      url: doc,
                      type: "file",
                    })
                  )
                : [];
              setAdditionalDocs(parsedDocs);
            } catch (err) {
              console.error("Error parsing additional documents:", err);
            }
          }

          setFormData({
            collegeName: data.collegeName || "",
            collegeCode: data.collegeCode || "",
            registrationNumber: data.registrationNumber || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            country: data.country || "India",
            pinCode: data.pinCode || "",
            websiteUrl: data.websiteUrl || "",
            contactEmail: data.contactEmail || "",
            contactPhone: data.contactPhone || "",
            about: data.about || "",
            bankAccountNumber: data.bankAccountNumber || "",
            bankName: data.bankName || "",
            accountHolderName: data.accountHolderName || "",
            ifscCode: data.ifscCode || "",
            banner: data.banner || null,
            verificationDocument: data.verificationDocument || null,
          });
        }
      } catch (err) {
        console.error("Failed to fetch college:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load college profile",
          confirmButtonColor: "#059669",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userid) fetchCollegeDetail();
  }, [userid]);

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    if (originalData) {
      setFormData({
        collegeName: originalData.collegeName || "",
        collegeCode: originalData.collegeCode || "",
        registrationNumber: originalData.registrationNumber || "",
        address: originalData.address || "",
        city: originalData.city || "",
        state: originalData.state || "",
        country: originalData.country || "India",
        pinCode: originalData.pinCode || "",
        websiteUrl: originalData.websiteUrl || "",
        contactEmail: originalData.contactEmail || "",
        contactPhone: originalData.contactPhone || "",
        about: originalData.about || "",
        bankAccountNumber: originalData.bankAccountNumber || "",
        bankName: originalData.bankName || "",
        accountHolderName: originalData.accountHolderName || "",
        ifscCode: originalData.ifscCode || "",
        banner: originalData.banner || null,
        verificationDocument: originalData.verificationDocument || null,
      });
      // Restore original additional documents
      if (originalData.additionalDocuments) {
        const parsedDocs = Array.isArray(originalData.additionalDocuments)
          ? originalData.additionalDocuments.map(
              (doc: string, index: number) => ({
                id: `doc-${index}`,
                name: doc.split("/").pop() || `Document ${index + 1}`,
                url: doc,
                type: "file",
              })
            )
          : [];
        setAdditionalDocs(parsedDocs);
      }
    }
  };

  const handleVerificationUpload = async (file: File) => {
    setUploading((prev) => ({ ...prev, verification: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/aws-upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        const url = result.url;

        setFormData((prev) => ({
          ...prev,
          verificationDocument: url,
        }));

        if (collegeDetail) {
          setCollegeDetail((prev) =>
            prev ? { ...prev, verificationDocument: url } : null
          );
        }

        Swal.fire({
          icon: "success",
          title: "Uploaded!",
          text: "Verification document uploaded successfully",
          timer: 2000,
          confirmButtonColor: "#059669",
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text:
          error instanceof Error ? error.message : "Failed to upload document",
        confirmButtonColor: "#059669",
      });
    } finally {
      setUploading((prev) => ({ ...prev, verification: false }));
    }
  };

  const handleAdditionalDocsUpload = async (files: File[]) => {
    setUploading((prev) => ({ ...prev, additional: true }));

    try {
      const uploadedDocs: AdditionalDocument[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/aws-upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          uploadedDocs.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            url: result.url,
            type: file.type,
          });
        } else {
          throw new Error(result.error || "Upload failed");
        }
      }

      // Update additional documents
      const newDocs = [...additionalDocs, ...uploadedDocs];
      setAdditionalDocs(newDocs);

      // Update form data with URLs array
      const docUrls = newDocs.map((doc) => doc.url);
      setFormData((prev) => ({
        ...prev,
        additionalDocuments: docUrls,
      }));

      Swal.fire({
        icon: "success",
        title: "Uploaded!",
        text: `${uploadedDocs.length} document(s) uploaded successfully`,
        timer: 2000,
        confirmButtonColor: "#059669",
      });
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text:
          error instanceof Error ? error.message : "Failed to upload documents",
        confirmButtonColor: "#059669",
      });
    } finally {
      setUploading((prev) => ({ ...prev, additional: false }));
    }
  };

  const handleRemoveAdditionalDoc = (id: string) => {
    const newDocs = additionalDocs.filter((doc) => doc.id !== id);
    setAdditionalDocs(newDocs);

    // Update form data with remaining URLs
    const docUrls = newDocs.map((doc) => doc.url);
    setFormData((prev) => ({
      ...prev,
      additionalDocuments: docUrls.length > 0 ? docUrls : null,
    }));
  };

  const handleVerificationFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please upload a PDF or image file (PDF, JPEG, PNG)",
        confirmButtonColor: "#059669",
      });
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      Swal.fire({
        icon: "error",
        title: "File Too Large",
        text: "Maximum file size is 50MB",
        confirmButtonColor: "#059669",
      });
      return;
    }

    handleVerificationUpload(file);
  };

  const handleAdditionalFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type)
    );
    if (invalidFiles.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Files",
        text: "Please upload only PDF, Word, or image files",
        confirmButtonColor: "#059669",
      });
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Files Too Large",
        text: "Maximum file size is 50MB per file",
        confirmButtonColor: "#059669",
      });
      return;
    }

    handleAdditionalDocsUpload(files);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (file: File, type: "logo" | "banner") => {
    setUploading((prev) => ({ ...prev, [type]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/aws-upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        const url = result.url;

        setFormData((prev) => ({
          ...prev,
          [type === "logo" ? "logo" : "banner"]: url,
        }));

        if (collegeDetail) {
          setCollegeDetail((prev) =>
            prev
              ? { ...prev, [type === "logo" ? "logo" : "banner"]: url }
              : null
          );
        }

        Swal.fire({
          icon: "success",
          title: "Uploaded!",
          text: `${type === "logo" ? "Logo" : "Banner"} uploaded successfully`,
          timer: 2000,
          confirmButtonColor: "#059669",
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error instanceof Error ? error.message : "Failed to upload file",
        confirmButtonColor: "#059669",
      });
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please upload a valid image file (JPEG, PNG, GIF, WebP)",
        confirmButtonColor: "#059669",
      });
      return;
    }

    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      Swal.fire({
        icon: "error",
        title: "File Too Large",
        text: "Maximum file size is 200MB",
        confirmButtonColor: "#059669",
      });
      return;
    }

    handleFileUpload(file, type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeDetail?.id) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/colleges?id=${collegeDetail.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error("Server returned non-JSON response");
      }

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error?.message || result.message || `HTTP ${res.status}`
        );
      }

      if (result.success) {
        setCollegeDetail(result.data);
        setOriginalData(result.data);
        setIsEditing(false);

        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "College profile updated successfully",
          timer: 2000,
          confirmButtonColor: "#059669",
        });
      } else {
        throw new Error(result.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err instanceof Error ? err.message : "Something went wrong!",
        confirmButtonColor: "#059669",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-emerald-500 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">
            Loading college profile...
          </p>
        </div>
      </div>
    );
  }

  if (!collegeDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            College Profile Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Your college profile hasn &apos;t been set up yet. Please contact the
            administrator to create your institution profile.
          </p>
          <button className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl">
            Contact Administrator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Banner Image at the top if present */}
      {/* {(formData.banner || collegeDetail.banner) && (
        <div className="relative h-48 md:h-64 w-full overflow-hidden">
          <img
            src={formData.banner || collegeDetail.banner || ""}
            alt="College Banner"
            className="w-full h-full object-cover"
          />
          {isEditing && (
            <div className="absolute top-4 right-4">
              <input
                type="file"
                id="banner-upload-top"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "banner")}
                className="hidden"
              />
              <label
                htmlFor="banner-upload-top"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-lg hover:bg-white cursor-pointer transition-all shadow-lg"
              >
                {uploading.banner ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {uploading.banner ? "Uploading..." : "Change Banner"}
                </span>
              </label>
            </div>
          )}
        </div>
      )} */}

      <div className="p-2 md:p-3">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
{isEditing ? (
  <div className="flex items-center gap-4">
    <div className="relative">
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border-2 border-gray-200">
        {(formData.logo || collegeDetail.logo) ? (
          <img 
            src={formData.logo || collegeDetail.logo || ''} 
            alt="College Logo" 
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Building2 className="w-10 h-10 text-gray-400" />
          </div>
        )}
      </div>
      <input
        type="file"
        id="logo-upload"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'logo')}
        className="hidden"
      />
      <label
        htmlFor="logo-upload"
        className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 cursor-pointer shadow-lg"
      >
        {uploading.logo ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
      </label>
    </div>
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-gray-900">
          <input
            type="text"
            name="collegeName"
            value={formData.collegeName || ''}
            onChange={handleInputChange}
            className="bg-transparent border-b-2 border-emerald-500 focus:outline-none focus:border-emerald-700 w-64"
            required
          />
        </h1>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
            <Hash className="w-3 h-3" />
            <input
              type="text"
              name="collegeCode"
              value={formData.collegeCode || ''}
              onChange={handleInputChange}
              className="bg-transparent focus:outline-none w-20"
              placeholder="Code"
            />
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            <Shield className="w-3 h-3" />
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber || ''}
              onChange={handleInputChange}
              className="bg-transparent focus:outline-none w-40"
              placeholder="Reg. No"
            />
          </span>
        </div>
      </div>
    </div>
  </div>
) : (
              <div className="flex items-center gap-4">
                {collegeDetail.logo ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border-2 border-gray-200 shadow-sm">
                    <img
                      src={collegeDetail.logo}
                      alt="College Logo"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-gray-200 flex items-center justify-center shadow-sm">
                    <Building2 className="w-10 h-10 text-emerald-600" />
                  </div>
                )}
              
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {collegeDetail.collegeName}
                  </h1>
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                      <Hash className="w-3 h-3" />
                      {collegeDetail.collegeCode}
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      <Shield className="w-3 h-3" />
                      {collegeDetail.registrationNumber}
                    </span>
                  </div>
               
              </div>
            )}

            <div className="flex-1"></div>

            <div className="flex gap-3">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="collegeForm"
                    disabled={saving}
                    className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-70 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between pt-4 border-t mb-8">
            <div className="flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  collegeDetail.status === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : collegeDetail.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {collegeDetail.status === "APPROVED" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : collegeDetail.status === "PENDING" ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {collegeDetail.status.charAt(0).toUpperCase() +
                  collegeDetail.status.slice(1).toLowerCase()}
              </div>
              <span className="text-sm text-gray-600">
                {collegeDetail.city}, {collegeDetail.state}
              </span>
            </div>
            {collegeDetail.websiteUrl && (
              <a
                href={collegeDetail.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Visit Website
              </a>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Contact & Address */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      label: "Email",
                      name: "contactEmail",
                      value: collegeDetail.contactEmail,
                      icon: <Mail className="w-4 h-4" />,
                      type: "email",
                    },
                    {
                      label: "Phone",
                      name: "contactPhone",
                      value: collegeDetail.contactPhone,
                      icon: <Phone className="w-4 h-4" />,
                    },
                    {
                      label: "Website",
                      name: "websiteUrl",
                      value: collegeDetail.websiteUrl,
                      icon: <Globe className="w-4 h-4" />,
                      type: "url",
                    },
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          {field.icon}
                          <input
                            type={field.type || "text"}
                            name={field.name}
                            value={
                              formData[field.name as keyof typeof formData] ||
                              ""
                            }
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            required={
                              field.name === "contactEmail" ||
                              field.name === "contactPhone"
                            }
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          {field.icon}
                          <span className="text-gray-900">
                            {field.name === "websiteUrl" && field.value ? (
                              <a
                                href={field.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-800 hover:underline"
                              >
                                {field.value}
                              </a>
                            ) : (
                              field.value || "—"
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Address Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Address
                </h2>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">
                        Full Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address || ""}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {["city", "state", "pinCode", "country"].map((field) => (
                        <div key={field}>
                          <label className="text-sm font-medium text-gray-700 mb-1 capitalize">
                            {field}
                          </label>
                          <input
                            type="text"
                            name={field}
                            value={
                              formData[field as keyof typeof formData] || ""
                            }
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-900">{collegeDetail.address}</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        {collegeDetail.city}, {collegeDetail.state}
                      </p>
                      <p>{collegeDetail.pinCode}</p>
                      <p>{collegeDetail.country}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Column - About & Documents */}
            <div className="space-y-6">
              {/* About College */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  About College
                </h2>
                {isEditing ? (
                  <textarea
                    name="about"
                    value={formData.about || ""}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Describe your college..."
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {collegeDetail.about || "No description provided."}
                  </p>
                )}
              </div>

              {/* Documents */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <File className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Documents
                    </h2>
                  </div>

                  {/* Small Verification Upload Box */}
                  {isEditing && (
                    <div className="relative">
                      <input
                        type="file"
                        id="verification-upload-small"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleVerificationFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="verification-upload-small"
                        className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                      >
                        {uploading.verification ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {uploading.verification
                            ? "Uploading..."
                            : "Verification"}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Verification Document Status */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Verification Document
                    </h3>
                    {formData.verificationDocument ||
                    collegeDetail.verificationDocument ? (
                      <div className="p-3 bg-emerald-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            <File className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-emerald-700">
                              Verification document uploaded
                            </span>
                            <p className="text-xs text-emerald-600">
                              PDF or Image
                            </p>
                          </div>
                        </div>
                        <a
                          href={
                            formData.verificationDocument ||
                            collegeDetail.verificationDocument ||
                            ""
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-emerald-200"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                        <File className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-500">
                          No verification document uploaded
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Additional Documents */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">
                        Additional Documents
                      </h3>
                      {isEditing && (
                        <>
                          <input
                            type="file"
                            id="additional-upload"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            multiple
                            onChange={handleAdditionalFileChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="additional-upload"
                            className="text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Files
                          </label>
                        </>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        {additionalDocs.length > 0 ? (
                          <div className="space-y-2">
                            {additionalDocs.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <File className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-700 truncate max-w-[180px]">
                                    {doc.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemoveAdditionalDoc(doc.id)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                            <span className="text-sm text-gray-500">
                              No additional documents
                            </span>
                          </div>
                        )}
                      </div>
                    ) : additionalDocs.length > 0 ? (
                      <div className="space-y-2">
                        {additionalDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700">
                                {doc.name}
                              </span>
                            </div>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <span className="text-sm text-gray-500">
                          No additional documents
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Banner Upload (Edit mode) & Bank Details */}
            <div className="space-y-6">
              {/* Banner Upload (Edit mode only) - Small box */}
              {isEditing && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Banner Image
                      </h2>
                    </div>

                    {/* Small Banner Upload Box */}
                    <div className="relative">
                      <input
                        type="file"
                        id="banner-upload-small"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "banner")}
                        className="hidden"
                      />
                      <label
                        htmlFor="banner-upload-small"
                        className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                      >
                        {uploading.banner ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {uploading.banner ? "Uploading..." : "Banner"}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Current Banner Preview */}
                  {(formData.banner || collegeDetail.banner) && (
                    <div className="mt-4">
                      <div className="relative h-32 w-full rounded-lg overflow-hidden border">
                        <img
                          src={formData.banner || collegeDetail.banner || ""}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end p-3">
                          <span className="text-xs font-medium text-white">
                            Current Banner Preview
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bank Details */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Bank Details
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Optional
                  </span>
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      label: "Bank Name",
                      name: "bankName",
                      icon: <Building2 className="w-4 h-4" />,
                    },
                    {
                      label: "Account Holder",
                      name: "accountHolderName",
                      icon: <User className="w-4 h-4" />,
                    },
                    {
                      label: "Account Number",
                      name: "bankAccountNumber",
                      icon: <CreditCard className="w-4 h-4" />,
                    },
                    {
                      label: "IFSC Code",
                      name: "ifscCode",
                      icon: <Banknote className="w-4 h-4" />,
                    },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          {field.icon}
                          <input
                            type="text"
                            name={field.name}
                            value={
                              formData[field.name as keyof typeof formData] ||
                              ""
                            }
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          {field.icon}
                          <span className="text-gray-900">
                            {collegeDetail[field.name as keyof CollegeData] ||
                              "Not provided"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden form for submission */}
      <form id="collegeForm" onSubmit={handleSubmit} className="hidden" />
    </div>
  );
};

export default CollegeProfile;
