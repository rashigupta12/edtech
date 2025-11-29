/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
// app/dashboard/admin/testimonials/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  X,
  Star,
  
  Image as ImageIcon,
} from "lucide-react";
import Swal from "sweetalert2";



export default function EditTestimonialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    studentImage: "",
    collegeName: "",
    courseName: "",
    rating: 5,
    testimonial: "",
    isApproved: false,
    isFeatured: false,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchTestimonial();
  }, [id]);

  const fetchTestimonial = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/testimonials?id=${id}`);
      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        setFormData({
          studentName: data.studentName,
          studentImage: data.studentImage || "",
          collegeName: data.collegeName || "",
          courseName: data.courseName || "",
          rating: data.rating,
          testimonial: data.testimonial,
          isApproved: data.isApproved,
          isFeatured: data.isFeatured,
          sortOrder: data.sortOrder,
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.studentName.trim()) {
      await Swal.fire({
        title: "Validation Error",
        text: "Student name is required",
        icon: "error",
      });
      return;
    }

    if (!formData.testimonial.trim()) {
      await Swal.fire({
        title: "Validation Error",
        text: "Testimonial text is required",
        icon: "error",
      });
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      await Swal.fire({
        title: "Validation Error",
        text: "Rating must be between 1 and 5",
        icon: "error",
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/testimonials?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          collegeName: formData.collegeName || null,
          courseName: formData.courseName || null,
          studentImage: formData.studentImage || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await Swal.fire({
          title: "Success!",
          text: "Testimonial updated successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push(`/dashboard/admin/testimonials/${id}`);
      } else {
        throw new Error(result.error || "Failed to update testimonial");
      }
    } catch (error) {
      await Swal.fire({
        title: "Error!",
        text: error instanceof Error ? error.message : "Failed to update testimonial",
        icon: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="bg-white rounded-lg shadow p-8">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            href={`/dashboard/admin/testimonials/${id}`}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Testimonial</h1>
            <p className="text-gray-600 mt-1">Update testimonial information</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Student Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter student name"
                />
              </div>

              {/* Student Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Image URL
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="url"
                      name="studentImage"
                      value={formData.studentImage}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  {formData.studentImage && (
                    <div className="w-12 h-12">
                      <img
                        src={formData.studentImage}
                        alt="Preview"
                        className="w-full h-full rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* College Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College/University Name
                </label>
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter college name"
                />
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter course name"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    min="1"
                    max="5"
                    required
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < formData.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Testimonial Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Testimonial <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="testimonial"
                  value={formData.testimonial}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter testimonial text..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.testimonial.length} characters
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-6 sticky top-4">
              {/* Sort Order */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lower numbers appear first
                </p>
              </div> */}

              {/* Approval Status */}
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isApproved"
                    checked={formData.isApproved}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Approved
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  Show this testimonial publicly
                </p>
              </div>

              {/* Featured Status */}
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Featured
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  Highlight this testimonial
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>

                <Link
                  href={`/dashboard/admin/testimonials/${id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}