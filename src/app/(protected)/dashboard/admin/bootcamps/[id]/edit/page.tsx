/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
// src/app/(protected)/dashboard/admin/bootcamps/[id]/edit/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, X, GripVertical } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

type College = {
  id: string;
  collegeName: string;
};

type Course = {
  id: string;
  title: string;
  slug: string;
};

type BootcampCourse = {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
};

type Bootcamp = {
  id: string;
  title: string;
  slug: string;
  description: string;
  collegeId: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  startDate: string;
  endDate: string;
  isFree: boolean;
  price: number | null;
  maxStudents: number | null;
};

export default function EditBootcampPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [bootcampCourses, setBootcampCourses] = useState<BootcampCourse[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    collegeId: "",
    thumbnailUrl: "",
    duration: "",
    startDate: "",
    endDate: "",
    isFree: true,
    price: "",
    maxStudents: "",
  });

  // Courses to add
  const [selectedNewCourses, setSelectedNewCourses] = useState<string[]>([]);

  // Fetch bootcamp data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch bootcamp
        const bootcampRes = await fetch(`/api/bootcamps?id=${params.id}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const bootcampData = await bootcampRes.json();

        if (!bootcampData.success) {
          throw new Error("Bootcamp not found");
        }

        const bootcamp: Bootcamp = bootcampData.data;

        setFormData({
          title: bootcamp.title,
          slug: bootcamp.slug,
          description: bootcamp.description || "",
          collegeId: bootcamp.collegeId || "",
          thumbnailUrl: bootcamp.thumbnailUrl || "",
          duration: bootcamp.duration || "",
          startDate: bootcamp.startDate.split('T')[0],
          endDate: bootcamp.endDate.split('T')[0],
          isFree: bootcamp.isFree,
          price: bootcamp.price ? String(bootcamp.price) : "",
          maxStudents: bootcamp.maxStudents ? String(bootcamp.maxStudents) : "",
        });

        // Fetch bootcamp courses
        const coursesRes = await fetch(`/api/bootcamps?id=${params.id}&courses=true`);
        const coursesData = await coursesRes.json();
        if (coursesData.success) {
          setBootcampCourses(coursesData.data);
        }

        // Fetch colleges
        const collegesRes = await fetch("/api/colleges");
        const collegesData = await collegesRes.json();
        if (collegesData.success) {
          setColleges(collegesData.data);
        }

        // Fetch all available courses
        const allCoursesRes = await fetch("/api/courses");
        const allCoursesData = await allCoursesRes.json();
        if (allCoursesData.success) {
          setAvailableCourses(allCoursesData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load bootcamp data",
        });
        router.push("/dashboard/admin/bootcamps");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedNewCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleRemoveCourse = async (courseId: string) => {
    const result = await Swal.fire({
      title: "Remove Course?",
      text: "Are you sure you want to remove this course from the bootcamp?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, remove it",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/bootcamps?id=${params.id}&courseId=${courseId}`, {
        method: "DELETE",
      });

      const response = await res.json();

      if (response.success) {
        setBootcampCourses((prev) => prev.filter((c) => c.id !== courseId));
        Swal.fire({
          icon: "success",
          title: "Removed",
          text: "Course removed from bootcamp",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to remove course",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.startDate || !formData.endDate) {
      Swal.fire({
        icon: "warning",
        title: "Missing Required Fields",
        text: "Please fill in title, start date, and end date",
      });
      return;
    }

    setSaving(true);

    const payload = {
      ...formData,
      collegeId: formData.collegeId || null,
      thumbnailUrl: formData.thumbnailUrl || null,
      duration: formData.duration || null,
      price: formData.price ? Number(formData.price) : null,
      maxStudents: formData.maxStudents ? Number(formData.maxStudents) : null,
    };

    try {
      // Update bootcamp basic info
      const res = await fetch(`/api/bootcamps?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await res.json();

      if (response.success) {
        // Add new courses
        for (let i = 0; i < selectedNewCourses.length; i++) {
          await fetch(`/api/bootcamps?id=${params.id}&addCourse=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseId: selectedNewCourses[i],
              sortOrder: bootcampCourses.length + i,
            }),
          });
        }

        Swal.fire({
          icon: "success",
          title: "Bootcamp Updated!",
          text: "Bootcamp has been updated successfully",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          router.push("/dashboard/admin/bootcamps");
          router.refresh();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.error?.message || "Failed to update bootcamp",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading bootcamp...</p>
        </div>
      </div>
    );
  }

  // Filter out courses already in bootcamp
  const availableNewCourses = availableCourses.filter(
    (course) => !bootcampCourses.some((bc) => bc.id === course.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/admin/bootcamps"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bootcamps
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Bootcamp</h1>
              <p className="text-gray-600">Update bootcamp details and manage courses.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Bootcamp Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    placeholder="Full Stack Web Development Bootcamp"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleFieldChange("slug", e.target.value)}
                    placeholder="full-stack-web-development-bootcamp"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    placeholder="Comprehensive bootcamp covering multiple courses..."
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="collegeId">College (Optional)</Label>
                  <Select
                    value={formData.collegeId || "NONE"}
                    onValueChange={(value) =>
                      handleFieldChange("collegeId", value === "NONE" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select college" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No college (Admin)</SelectItem>
                      {colleges.map((college) => (
                        <SelectItem key={college.id} value={college.id}>
                          {college.collegeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleFieldChange("duration", e.target.value)}
                    placeholder="16 weeks"
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFieldChange("startDate", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFieldChange("endDate", e.target.value)}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                  <Input
                    id="thumbnailUrl"
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) => handleFieldChange("thumbnailUrl", e.target.value)}
                    placeholder="https://example.com/bootcamp-thumbnail.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => handleFieldChange("maxStudents", e.target.value)}
                    placeholder="200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-50 border-b">
              <CardTitle className="text-xl text-gray-900">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFree"
                  checked={formData.isFree}
                  onChange={(e) => handleFieldChange("isFree", e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="isFree">This bootcamp is free</Label>
              </div>

              {!formData.isFree && (
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleFieldChange("price", e.target.value)}
                    placeholder="499.00"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Courses */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-50 border-b">
              <div>
                <CardTitle className="text-xl text-gray-900">Current Courses</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {bootcampCourses.length} courses in this bootcamp
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {bootcampCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No courses added yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bootcampCourses.map((course, index) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                    >
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <p className="text-sm text-gray-500">{course.slug}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCourse(course.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add New Courses */}
          {availableNewCourses.length > 0 && (
            <Card className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-50 border-b">
                <div>
                  <CardTitle className="text-xl text-gray-900">Add More Courses</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Select additional courses to add ({selectedNewCourses.length} selected)
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableNewCourses.map((course) => (
                    <div
                      key={course.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedNewCourses.includes(course.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleCourseToggle(course.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedNewCourses.includes(course.id)}
                          onChange={() => {}}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{course.title}</h4>
                          <p className="text-sm text-gray-500">{course.slug}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 pb-8">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/admin/bootcamps">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving…" : "Update Bootcamp"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}