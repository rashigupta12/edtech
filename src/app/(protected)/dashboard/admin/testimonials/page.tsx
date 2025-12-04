/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
// app/dashboard/admin/testimonials/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  CheckCircle,
  XCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import Swal from "sweetalert2";
import Image from "next/image";

interface Testimonial {
  id: string;
  studentName: string;
  studentImage?: string;
  collegeName?: string;
  courseName?: string;
  rating: number;
  testimonial: string;
  isApproved: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function TestimonialsListPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "approved" | "pending">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "regular">("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (approvalFilter !== "all") {
        params.append("isApproved", approvalFilter === "approved" ? "true" : "false");
      }

      if (featuredFilter !== "all") {
        params.append("isFeatured", featuredFilter === "featured" ? "true" : "false");
      }

      const response = await fetch(`/api/testimonials?${params}`);
      const result = await response.json();

      if (result.success) {
        setTestimonials(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, approvalFilter, featuredFilter]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchTestimonials();
      } else {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async (id: string, studentName: string) => {
    const result = await Swal.fire({
      title: "Delete Testimonial?",
      text: `Are you sure you want to delete testimonial from "${studentName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/testimonials?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: "Deleted!",
          text: "Testimonial deleted successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchTestimonials();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      await Swal.fire({
        title: "Error!",
        text: error instanceof Error ? error.message : "Failed to delete testimonial",
        icon: "error",
      });
    }
  };

  const handleToggleApproval = async (id: string, studentName: string, currentStatus: boolean) => {
    const result = await Swal.fire({
      title: `${currentStatus ? "Unapprove" : "Approve"} Testimonial?`,
      text: `Are you sure you want to ${currentStatus ? "unapprove" : "approve"} "${studentName}"'s testimonial?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${currentStatus ? "unapprove" : "approve"} it!`,
      cancelButtonText: "Cancel",
      confirmButtonColor: currentStatus ? "#dc2626" : "#16a34a",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/testimonials?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: "Success!",
          text: `Testimonial ${currentStatus ? "unapproved" : "approved"} successfully`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchTestimonials();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      await Swal.fire({
        title: "Error!",
        text: error instanceof Error ? error.message : "Failed to update status",
        icon: "error",
      });
    }
  };

  const handleToggleFeatured = async (id: string, studentName: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/testimonials?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: "Success!",
          text: `Testimonial ${currentStatus ? "unmarked" : "marked"} as featured`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchTestimonials();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      await Swal.fire({
        title: "Error!",
        text: error instanceof Error ? error.message : "Failed to update featured status",
        icon: "error",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  if (loading && testimonials.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
        <p className="text-gray-600 mt-2">Manage student testimonials and reviews</p>
      </div>
       {/* Filters and Actions */}
        <div className="flex flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search testimonials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Approval Filter */}
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>

          {/* Featured Filter */}
          {/* <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="featured">Featured</option>
            <option value="regular">Regular</option>
          </select> */}
          
        {/* Create Button */}
        <Link
          href="/dashboard/admin/testimonials/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Testimonial
        </Link>
        </div>

      </div>

     

      {/* Testimonials Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Testimonial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testimonials.map((testimonial) => (
                <tr key={testimonial.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {testimonial.studentImage ? (
                        <Image
                          src={testimonial.studentImage}
                          alt={testimonial.studentName}
                          className="w-10 h-10 rounded-full object-cover"
                          width={20}
                          height={20}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 font-medium">
                            {testimonial.studentName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {testimonial.studentName}
                        </div>
                        {testimonial.collegeName && (
                          <div className="text-sm text-gray-500">{testimonial.collegeName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{renderStars(testimonial.rating)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-xs">
                      {testimonial.testimonial}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          testimonial.isApproved
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {testimonial.isApproved ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Pending
                          </>
                        )}
                      </span>
                      {testimonial.isFeatured && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Award className="w-3 h-3 mr-1" />
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(testimonial.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dashboard/admin/testimonials/${testimonial.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/dashboard/admin/testimonials/${testimonial.id}/edit`}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() =>
                          handleToggleApproval(
                            testimonial.id,
                            testimonial.studentName,
                            testimonial.isApproved
                          )
                        }
                        className={`${
                          testimonial.isApproved
                            ? "text-orange-600 hover:text-orange-900"
                            : "text-green-600 hover:text-green-900"
                        }`}
                        title={testimonial.isApproved ? "Unapprove" : "Approve"}
                      >
                        {testimonial.isApproved ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          handleToggleFeatured(
                            testimonial.id,
                            testimonial.studentName,
                            testimonial.isFeatured
                          )
                        }
                        className={`${
                          testimonial.isFeatured
                            ? "text-purple-600 hover:text-purple-900"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                        title={testimonial.isFeatured ? "Unmark Featured" : "Mark as Featured"}
                      >
                        <Award className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(testimonial.id, testimonial.studentName)
                        }
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {testimonials.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || approvalFilter !== "all" || featuredFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first testimonial"}
            </p>
            {!searchTerm && approvalFilter === "all" && featuredFilter === "all" && (
              <Link
                href="/dashboard/admin/testimonials/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Testimonial
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span> results
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={!pagination.hasPrev}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.hasNext}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}