// app/dashboard/admin/colleges/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, PlusCircle, RefreshCcw, Trash, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddAdminForm from "@/components/admin/Addadminform";

interface College {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  collegeCode?: string;
  state?: string | null;
  status: "active" | "inactive" | "pending";
  createdAt: string;
  updatedAt: string;
  contactEmail: string;
  contactPhone: string;
  userId?: string;
}

interface ApiCollege {
  id: string;
  collegeName?: string;
  collegeCode?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  status?: string;
  logo?: string | null;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
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
    "all" | "active" | "inactive" | "pending"
  >("all");

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/colleges");

      if (!response.ok) {
        throw new Error("Failed to fetch colleges");
      }

      const data = await response.json();

      // Extract colleges array from response
      let collegesArray: ApiCollege[] = data.colleges || data.data || data;

      // If it's not an array, wrap it
      if (!Array.isArray(collegesArray)) {
        collegesArray = [collegesArray];
      }

      // Map API response fields to component interface
      const mappedColleges: College[] = collegesArray.map(
        (college: ApiCollege) => ({
          id: college.id,
          name: college.collegeName || "",
          collegeCode: college.collegeCode || "",
          email: college.contactEmail || "",
          phone: college.contactPhone || null,
          address: college.address || null,
          city: college.city || null,
          state: college.state || null,
          status:
            (college.status?.toLowerCase() as
              | "active"
              | "inactive"
              | "pending") || "pending",
          createdAt: college.createdAt || new Date().toISOString(),
          updatedAt:
            college.updatedAt || college.createdAt || new Date().toISOString(),
          userId: college.userId || undefined, // Map the userId from API
        })
      );

      setColleges(mappedColleges);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = (collegeId: string, collegeName: string) => {
    setSelectedCollege({ id: collegeId, name: collegeName });
    setIsAdminFormOpen(true);
  };

  const handleAdminCreated = () => {
    // Refresh the colleges list or show success message
    console.log("Admin created successfully");
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses] || "bg-gray-100"
        }`}
      >
        {status}
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

  // Fixed filter function with proper null checking
  const filteredColleges = colleges.filter((college) => {
    const searchLower = searchTerm.toLowerCase();

    // Apply status filter
    if (statusFilter !== "all" && college.status !== statusFilter) {
      return false;
    }

    // Apply search filter
    if (!searchTerm) return true;

    return (
      college.name?.toLowerCase().includes(searchLower) ||
      college.email?.toLowerCase().includes(searchLower) ||
      (college.city?.toLowerCase() || "").includes(searchLower) ||
      (college.state?.toLowerCase() || "").includes(searchLower) ||
      (college.phone?.toLowerCase() || "").includes(searchLower) ||
      (college.address?.toLowerCase() || "").includes(searchLower)
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
      fetchColleges();
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
              <div className="ml-auto pl-3">
                <button
                  onClick={fetchColleges}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
                >
                  Retry
                </button>
              </div>
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
        <div className="mb-6 flex justify-between items-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Colleges</h1>
            <p className="text-gray-600 mt-2">
              Manage all registered colleges and their information
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 w-full sm:max-w-md">
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
                  placeholder="Search colleges by name, email, city, or state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive" | "pending"
                  )
                }
                className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 text-sm font-medium"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Approved</option>
                <option value="inactive">Suspended</option>
              </select>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                <Link
                  href="/dashboard/admin/colleges/add"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New College
                </Link>
              </Button>
              {/* <button
                onClick={fetchColleges}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <RefreshCcw className="h-4 w-4" />
              </button> */}
            </div>
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
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by adding a new college"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      College
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      College Code
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Created
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredColleges.map((college) => (
                    <tr key={college.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {college.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {college.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {college.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {displaySafeValue(college.phone)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {displaySafeValue(college.collegeCode)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {college.city && college.state
                            ? `${college.city}, ${college.state}`
                            : displaySafeValue(college.city) ||
                              displaySafeValue(college.state)}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {displaySafeValue(college.address)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(college.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(college.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/dashboard/admin/colleges/${college.id}`}
                            className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded text-sm"
                          >
                            View
                          </Link>
                          <Link
                            href={`/dashboard/admin/colleges/${college.id}/edit`}
                            className="text-green-600 hover:text-green-900 px-2 py-1 rounded text-sm"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() =>
                              deleteCollege(college.id, college.name)
                            }
                            className="text-red-600 hover:text-red-900 px-2 py-1 rounded text-sm"
                          >
                            <Trash className="h-4 w-4 inline" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {college.userId ? (
                          <div className="text-gray-600">
                            <span className="font-medium">User ID:</span>
                            <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                              {college.userId}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              handleAddAdmin(college.id, college.name)
                            }
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Add Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <AddAdminForm
          collegeId={selectedCollege?.id || ""}
          collegeName={selectedCollege?.name || ""}
          isOpen={isAdminFormOpen}
          onClose={() => setIsAdminFormOpen(false)}
          onSuccess={handleAdminCreated}
        />
      </div>

      {/* Footer Info */}
      <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
        <div>
          Showing {filteredColleges.length} of {colleges.length} colleges
          {statusFilter !== "all" && (
            <span className="ml-2">
              (filtered by{" "}
              <span className="font-medium capitalize">{statusFilter}</span>)
            </span>
          )}
        </div>
        {(searchTerm || statusFilter !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
