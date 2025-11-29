/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
// app/dashboard/admin/testimonials/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  X,
  Star,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Swal from "sweetalert2";

interface College {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
}

export default function CreateTestimonialPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [uploading, setUploading] = useState(false);
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

  // Add upload handler function
  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/aws-upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.url) {
        setFormData((prev) => ({ ...prev, studentImage: result.url }));
        await Swal.fire({
          title: "Success!",
          text: "Image uploaded successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      await Swal.fire({
        title: "Upload Error",
        text: error instanceof Error ? error.message : "Failed to upload image",
        icon: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Reset file input
    e.target.value = "";

    if (file) {
      // Validate only one file
      if (e.target.files && e.target.files.length > 1) {
        Swal.fire({
          title: "Multiple Files",
          text: "Please upload only one image at a time",
          icon: "warning",
        });
        return;
      }

      // Validate file type and size
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          title: "Invalid File",
          text: "Please select a JPEG, PNG, GIF, or WebP image",
          icon: "error",
        });
        return;
      }

      if (file.size > maxSize) {
        Swal.fire({
          title: "File Too Large",
          text: "Please select an image smaller than 10MB",
          icon: "error",
        });
        return;
      }

      // Check if there's already an image and confirm replacement
      if (formData.studentImage) {
        Swal.fire({
          title: "Replace Image?",
          text: "There is already an image uploaded. Do you want to replace it?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Yes, replace it!",
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            handleImageUpload(file);
          }
        });
      } else {
        handleImageUpload(file);
      }
    }
  };
  const clearFileInput = () => {
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
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

      const response = await fetch("/api/testimonials", {
        method: "POST",
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
          text: "Testimonial created successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/dashboard/admin/testimonials");
      } else {
        throw new Error(result.error || "Failed to create testimonial");
      }
    } catch (error) {
      await Swal.fire({
        title: "Error!",
        text:
          error instanceof Error
            ? error.message
            : "Failed to create testimonial",
        icon: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchColleges();
    fetchCourses();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch("/api/colleges");
      const result = await response.json();
      if (result.success) {
        // Transform the API response to match the expected format
        const transformedColleges = result.data.map((college: any) => ({
          id: college.id,
          name: college.collegeName, // Use collegeName from API as name
        }));
        setColleges(transformedColleges);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
      await Swal.fire({
        title: "Error!",
        text: "Failed to load colleges",
        icon: "error",
      });
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      const result = await response.json();
      if (result.success) {
        // Transform the API response to match the expected format
        const transformedCourses = result.data.map((course: any) => ({
          id: course.id,
          name: course.title, // Use title from API as name
        }));
        setCourses(transformedCourses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      await Swal.fire({
        title: "Error!",
        text: "Failed to load courses",
        icon: "error",
      });
    }
  };

  

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

  const handleRatingClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

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
            <h1 className="text-3xl font-bold text-gray-900">
              Create Testimonial
            </h1>
            <p className="text-gray-600 mt-1">Add a new student testimonial</p>
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
              {/* Student Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Image
                </label>

                {/* Upload Area */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <>
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <p className="text-sm text-gray-600">
                              Uploading...
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              JPEG, PNG, GIF, WebP (Max 10MB)
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  {/* Preview */}
                  {formData.studentImage && (
                    <div className="relative">
                      <img
                        src={formData.studentImage}
                        alt="Preview"
                        className="w-24 h-24 rounded-lg object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            studentImage: "",
                          }));
                          clearFileInput();
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* URL Input Fallback */}
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">
                    Or enter image URL:
                  </p>
                  <input
                    type="url"
                    name="studentImage"
                    value={formData.studentImage}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              {/* College Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College/University Name
                </label>
                <select
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a college</option>
                  {colleges.map((college) => (
                    <option key={college.id} value={college.name}>
                      {college.name}
                    </option>
                  ))}
                </select>
                {colleges.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    No colleges available. Please add colleges first.
                  </p>
                )}
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name
                </label>
                <select
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.name}>
                      {course.name}
                    </option>
                  ))}
                </select>
                {courses.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    No courses available. Please add courses first.
                  </p>
                )}
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
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 cursor-pointer ${
                            star <= formData.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300 hover:text-yellow-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {formData.rating} out of 5
                  </span>
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
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter the student's testimonial here... Share their experience, feedback, and thoughts about the course or program."
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    Write a detailed testimonial from the student's perspective
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    {formData.testimonial.length} characters
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-6 sticky top-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Settings
                </h3>

                {/* Approval Status */}
                <div className="mb-4">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      name="isApproved"
                      checked={formData.isApproved}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      Approved
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 ml-6">
                    Make this testimonial visible to the public
                  </p>
                </div>

                {/* Featured Status */}
                <div>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      Featured
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 ml-6">
                    Highlight this testimonial on main sections
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  💡 Quick Tips
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Keep testimonials authentic and genuine</li>
                  <li>• Include specific details for credibility</li>
                  <li>• Use high-quality student photos</li>
                  <li>• Verify student consent before publishing</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Testimonial
                    </>
                  )}
                </button>

                <Link
                  href="/dashboard/admin/testimonials"
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors font-medium"
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
