// app/dashboard/admin/colleges/page.tsx
"use client";

import AddAdminForm from "@/components/admin/Addadminform";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, Phone, Plus, Shield, Trash, User, UserPlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface CollegeAdmin {
  id: string;
  name: string;
  email: string;
  mobile?: string | null;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface College {
  id: string;
  collegeName: string;
  collegeCode: string;
  contactEmail: string;
  contactPhone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
  userId?: string; // College admin's user ID
  createdBy?: string; // ID of person who created this college record
  admin?: CollegeAdmin;
  logo?: string | null;
  websiteUrl?: string | null;
}

interface ApiCollege {
  id: string;
  collegeName: string;
  collegeCode: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  city?: string;
  state?: string;
  status: string;
  logo?: string | null;
  websiteUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  createdBy?: string;
}

export default function CollegesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
  >("all");


   // Fetch colleges + admin data in parallel (fast & warning-free)
  useEffect(() => {
    const loadColleges = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/colleges");
        if (!response.ok) throw new Error("Failed to fetch colleges");

        const data = await response.json();
        let collegesArray: ApiCollege[] = data.colleges || data.data || data;
        if (!Array.isArray(collegesArray)) collegesArray = [collegesArray];

        // Fetch all admins in parallel
        const collegesWithAdmins = await Promise.all(
          collegesArray.map(async (college: ApiCollege) => {
            let admin: CollegeAdmin | undefined = undefined;

            if (college.userId) {
              try {
                const userRes = await fetch(`/api/users?id=${college.userId}`);
                if (userRes.ok) {
                  const user = await userRes.json();
                  admin = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile || null,
                    isActive: user.isActive !== false,
                    lastLoginAt: user.lastLoginAt,
                    createdAt: user.createdAt,
                  };
                }
              } catch (err) {
                console.error(`Failed to fetch admin ${college.userId}:`, err);
              }
            }

            return {
              id: college.id,
              collegeName: college.collegeName,
              collegeCode: college.collegeCode,
              contactEmail: college.contactEmail,
              contactPhone: college.contactPhone,
              address: college.address || null,
              city: college.city || null,
              state: college.state || null,
              status: (college.status as College["status"]) || "PENDING",
              createdAt: college.createdAt,
              updatedAt: college.updatedAt || college.createdAt,
              userId: college.userId,
              createdBy: college.createdBy,
              admin,
              logo: college.logo || null,
              websiteUrl: college.websiteUrl || null,
            } satisfies College;
          })
        );

        setColleges(collegesWithAdmins);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to load colleges");
      } finally {
        setLoading(false);
      }
    };

    loadColleges();
  }, []); // Only runs once on mount → perfect

  const handleAddAdmin = (collegeId: string, collegeName: string) => {
    setSelectedCollege({ id: collegeId, name: collegeName });
    setIsAdminFormOpen(true);
  };

const handleAdminCreated = async (newAdminUserId: string) => {
  try {
    if (!selectedCollege) {
      throw new Error("No college selected");
    }

    console.log("Updating college with admin user ID:", newAdminUserId);

    // Update the college record with the new admin's user ID
    const updateResponse = await fetch(`/api/colleges?id=${selectedCollege.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: newAdminUserId, // Set the college admin's user ID
        status: "APPROVED" // Optionally update status to APPROVED
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(errorData.error || "Failed to update college with admin user");
    }

    const updateResult = await updateResponse.json();
    console.log("College update response:", updateResult);

    // Refresh the colleges list to show the newly created admin
    // await refreshcollegs();
    setIsAdminFormOpen(false);
    setSelectedCollege(null);
    
    console.log("Admin created and college updated successfully");
  } catch (err) {
    console.error("Error updating college with admin:", err);
    setError(
      err instanceof Error
        ? err.message
        : "An error occurred while updating college with admin"
    );
  }
};

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      PENDING: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      APPROVED: "bg-green-100 text-green-800 border border-green-200",
      REJECTED: "bg-red-100 text-red-800 border border-red-200",
      SUSPENDED: "bg-gray-100 text-gray-800 border border-gray-200",
    };

    const statusLabels = {
      PENDING: "Pending",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      SUSPENDED: "Suspended",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses] || "bg-gray-100"
        }`}
      >
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter function
  const filteredColleges = colleges.filter((college) => {
    const searchLower = searchTerm.toLowerCase();

    // Apply status filter
    if (statusFilter !== "all" && college.status !== statusFilter) {
      return false;
    }

    // Apply search filter
    if (!searchTerm) return true;

    return (
      college.collegeName?.toLowerCase().includes(searchLower) ||
      college.collegeCode?.toLowerCase().includes(searchLower) ||
      college.contactEmail?.toLowerCase().includes(searchLower) ||
      (college.city?.toLowerCase() || "").includes(searchLower) ||
      (college.state?.toLowerCase() || "").includes(searchLower) ||
      (college.contactPhone?.toLowerCase() || "").includes(searchLower) ||
      (college.address?.toLowerCase() || "").includes(searchLower) ||
      college.admin?.name?.toLowerCase().includes(searchLower) ||
      college.admin?.email?.toLowerCase().includes(searchLower)
    );
  });

  const deleteCollege = async (collegeId: string, collegeName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${collegeName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/colleges?id=${collegeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete college");
      }

      // Refresh the colleges list
    } catch (err) {
      console.error("Delete error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while deleting college"
      );
    }
  };

  // Safe value display helper
  const displaySafeValue = (
    value: string | null | undefined,
    fallback: string = "N/A"
  ) => {
    return value || fallback;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading colleges
                </h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
              {/* <div className="ml-auto pl-3">
                <button
                  onClick={fetchColleges}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
                >
                  Retry
                </button>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Colleges Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all registered colleges and their administrators
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="w-full lg:max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search colleges by name, code, email, city, or admin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm font-medium"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <Button
              asChild
              className="bg-green-600 text-white"
            >
              <Link
                href="/dashboard/admin/colleges/add"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New College
              </Link>
            </Button>
          </div>
        </div>

        {/* Colleges Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredColleges.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No colleges found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search terms or filters"
                  : "Get started by adding a new college"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College Admin
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredColleges.map((college) => (
                    <tr key={college.id} className="hover:bg-gray-50">
                      {/* College Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {college.logo ? (
                              <Image
                                src={college.logo}
                                alt={college.collegeName}
                                className="h-8 w-8 rounded"
                                width={10}
                                height={10}
                              />
                            ) : (
                              <span className="text-blue-600 font-semibold text-sm">
                                {college.collegeName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {college.collegeName}
                            </div>
                            <div className="text-sm text-gray-500 font-mono">
                              {college.collegeCode}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {formatDate(college.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900 mb-1">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          {college.contactEmail}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {displaySafeValue(college.contactPhone)}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {college.city && college.state
                            ? `${college.city}, ${college.state}`
                            : displaySafeValue(college.city) || displaySafeValue(college.state)}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {displaySafeValue(college.address)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(college.status)}
                      </td>

                      {/* College Admin */}
                      <td className="px-6 py-4">
                        {college.admin ? (
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-green-500 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {college.admin.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {college.admin.email}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              <Shield className={`h-3 w-3 inline mr-1 ${college.admin.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                              {college.admin.isActive ? 'Active' : 'Inactive'}
                              {college.admin.lastLoginAt && (
                                <div className="mt-1">
                                  Last login: {formatDateTime(college.admin.lastLoginAt)}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddAdmin(college.id, college.collegeName)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Admin
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/dashboard/admin/colleges/${college.id}`}
                            className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            href={`/dashboard/admin/colleges/${college.id}/edit`}
                            className="text-green-600 hover:text-green-900 px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => deleteCollege(college.id, college.collegeName)}
                            className="text-red-600 hover:text-red-900 px-3 py-1 rounded text-sm font-medium transition-colors"
                            title="Delete College"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <div>
            Showing <span className="font-semibold">{filteredColleges.length}</span> of{" "}
            <span className="font-semibold">{colleges.length}</span> colleges
            {statusFilter !== "all" && (
              <span className="ml-2">
                (filtered by{" "}
                <span className="font-medium capitalize">{statusFilter.toLowerCase()}</span>)
              </span>
            )}
          </div>
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="text-blue-600 hover:text-blue-800 font-medium mt-2 sm:mt-0"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Add Admin Form Modal */}
      <AddAdminForm
        collegeId={selectedCollege?.id || ""}
        collegeName={selectedCollege?.name || ""}
        isOpen={isAdminFormOpen}
        onClose={() => {
          setIsAdminFormOpen(false);
          setSelectedCollege(null);
        }}
        onSuccess={handleAdminCreated}
      />
    </div>
  );
}