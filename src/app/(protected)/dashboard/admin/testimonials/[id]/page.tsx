
/*eslint-disable @typescript-eslint/no-unused-vars */
// app/dashboard/admin/testimonials/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  User,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import Swal from "sweetalert2";

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

export default function ViewTestimonialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonial();
  }, [id]);

  const fetchTestimonial = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/testimonials?id=${id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setTestimonial(result.data);
      } else {
        await Swal.fire({
          title: "Error!",
          text: "Testimonial not found",
          icon: "error",
        });
        router.push("/dashboard/admin/testimonials");
      }
    } catch (error) {
      console.error("Error fetching testimonial:", error);
      await Swal.fire({
        title: "Error!",
        text: "Failed to load testimonial",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Testimonial?",
      text: "This action cannot be undone!",
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
        router.push("/dashboard/admin/testimonials");
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

  const handleToggleApproval = async () => {
    if (!testimonial) return;

    try {
      const response = await fetch(`/api/testimonials?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !testimonial.isApproved }),
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: "Success!",
          text: `Testimonial ${testimonial.isApproved ? "unapproved" : "approved"} successfully`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchTestimonial();
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

  const handleToggleFeatured = async () => {
    if (!testimonial) return;

    try {
      const response = await fetch(`/api/testimonials?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !testimonial.isFeatured }),
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: "Success!",
          text: `Testimonial ${testimonial.isFeatured ? "unmarked" : "marked"} as featured`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchTestimonial();
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-6 h-6 ${
              i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-lg text-gray-600 font-medium">({rating}/5)</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="bg-white rounded-lg shadow p-8">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!testimonial) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            href="/dashboard/admin/testimonials"
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">View Testimonial</h1>
            <p className="text-gray-600 mt-1">Testimonial details and information</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleToggleApproval}
            className={`inline-flex items-center px-4 py-2 rounded-lg ${
              testimonial.isApproved
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {testimonial.isApproved ? (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Unapprove
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </>
            )}
          </button>

          <button
            onClick={handleToggleFeatured}
            className={`inline-flex items-center px-4 py-2 rounded-lg ${
              testimonial.isFeatured
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            <Award className="w-4 h-4 mr-2" />
            {testimonial.isFeatured ? "Featured" : "Mark Featured"}
          </button>

          <Link
            href={`/dashboard/admin/testimonials/${id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>

          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>

            <div className="flex items-start mb-6">
              {testimonial.studentImage ? (
                <img
                  src={testimonial.studentImage}
                  alt={testimonial.studentName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl font-medium">
                    {testimonial.studentName.charAt(0)}
                  </span>
                </div>
              )}

              <div className="ml-4 flex-1">
                <h3 className="text-2xl font-bold text-gray-900">
                  {testimonial.studentName}
                </h3>
                {testimonial.collegeName && (
                  <div className="flex items-center text-gray-600 mt-1">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    {testimonial.collegeName}
                  </div>
                )}
                {testimonial.courseName && (
                  <div className="flex items-center text-gray-600 mt-1">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {testimonial.courseName}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Rating</h3>
              {renderStars(testimonial.rating)}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Testimonial</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {testimonial.testimonial}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Approval Status</span>
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
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Featured</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    testimonial.isFeatured
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {testimonial.isFeatured ? (
                    <>
                      <Award className="w-3 h-3 mr-1" />
                      Yes
                    </>
                  ) : (
                    "No"
                  )}
                </span>
              </div>

              {/* <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sort Order</span>
                <span className="text-sm font-medium text-gray-900">
                  {testimonial.sortOrder}
                </span>
              </div> */}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>

            <div className="space-y-3">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Created
                </div>
                <p className="text-sm font-medium text-gray-900 ml-6">
                  {formatDate(testimonial.createdAt)}
                </p>
              </div>

              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Last Updated
                </div>
                <p className="text-sm font-medium text-gray-900 ml-6">
                  {formatDate(testimonial.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}