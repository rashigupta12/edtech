"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/auth";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
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

// Move generateSlug outside the component to make it stable
const generateSlug = (text: string) => {
  // First, clean the input
  const cleaned = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, " ") // Normalize spaces and underscores to single space
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // Split into words
  const words = cleaned.split(/\s+/).filter((word) => word.length > 0);

  // Generate slug based on word count
  let slug = "";

  if (words.length === 0) {
    return ""; // Empty input case
  } else if (words.length === 1) {
    // Single word: take first three letters
    slug = words[0].substring(0, 3);
  } else {
    // Multiple words: take first letter of each word
    slug = words.map((word) => word[0]).join("");
  }

  // Ensure the slug doesn't end up empty
  if (!slug) {
    return words[0] || "";
  }

  return slug;
};

export default function CreateBootcampPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const user = useCurrentUser();
  
  // Track if user has manually edited the slug
  const slugManuallyEdited = useRef(false);

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
    status: "DRAFT",
  });

  // Selected courses for bootcamp
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  /* --------------------------------------------------------------
     1. Fetch colleges & courses
     -------------------------------------------------------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [collegesRes, coursesRes] = await Promise.all([
          fetch("/api/colleges"),
          fetch("/api/courses"),
        ]);

        const collegesData = await collegesRes.json();
        const coursesData = await coursesRes.json();

        if (collegesData.success) setColleges(collegesData.data);
        if (coursesData.success) setAvailableCourses(coursesData.data);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };

    loadData();
  }, []);

  /* --------------------------------------------------------------
     2. Auto-generate slug from title
     -------------------------------------------------------------- */
  useEffect(() => {
    // Only generate slug if:
    // 1. There's a title
    // 2. User hasn't manually edited the slug
    if (formData.title.trim() && !slugManuallyEdited.current) {
      const newSlug = generateSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug: newSlug }));
    }
  }, [formData.title]); // Only depend on title

  /* --------------------------------------------------------------
     Rest of the component
     -------------------------------------------------------------- */
  const handleFieldChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    // Track if user is manually editing the slug
    if (field === "slug" && typeof value === "string") {
      slugManuallyEdited.current = true;
    }
    
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startDate || !formData.endDate) {
      Swal.fire({
        icon: "warning",
        title: "Missing Required Fields",
        text: "Please fill in title, start date, and end date",
      });
      return;
    }

    if (selectedCourses.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Courses Selected",
        text: "Please select at least one course for the bootcamp",
      });
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      createdBy: user?.id,
      collegeId: formData.collegeId || null,
      thumbnailUrl: formData.thumbnailUrl || null,
      price: formData.price ? Number(formData.price) : null,
      maxStudents: formData.maxStudents ? Number(formData.maxStudents) : null,
      status: formData.status || "DRAFT",
    };

    try {
      const res = await fetch("/api/bootcamps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await res.json();

      if (response.success) {
        const bootcampId = response.data.id;

        // Add selected courses
        for (let i = 0; i < selectedCourses.length; i++) {
          await fetch(`/api/bootcamps?id=${bootcampId}&addCourse=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseId: selectedCourses[i],
              sortOrder: i,
            }),
          });
        }

        Swal.fire({
          icon: "success",
          title: "Bootcamp Created!",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => router.push("/dashboard/admin/bootcamps"));
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.error?.message || "Failed to create bootcamp",
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
      setLoading(false);
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create New Bootcamp
              </h1>
              <p className="text-gray-600">
                Fill in the bootcamp details and select courses to bundle.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <CardTitle className="text-xl text-gray-900">
                Basic Information
              </CardTitle>
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
                    placeholder="fswd"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {slugManuallyEdited.current 
                      ? "Manually edited" 
                      : "Auto-generated (you can edit)"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    placeholder="Comprehensive bootcamp covering multiple courses..."
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="collegeId">College (Optional)</Label>
                  <Select
                    value={formData.collegeId || "NONE"}
                    onValueChange={(value) =>
                      handleFieldChange(
                        "collegeId",
                        value === "NONE" ? "" : value
                      )
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
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleFieldChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) =>
                      handleFieldChange("duration", e.target.value)
                    }
                    placeholder="16 weeks"
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      handleFieldChange("startDate", e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      handleFieldChange("endDate", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                  <Input
                    id="thumbnailUrl"
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) =>
                      handleFieldChange("thumbnailUrl", e.target.value)
                    }
                    placeholder="https://example.com/bootcamp-thumbnail.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <NumberInput
                    id="maxStudents"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      handleFieldChange("maxStudents", e.target.value)
                    }
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
                  onChange={(e) =>
                    handleFieldChange("isFree", e.target.checked)
                  }
                  className="rounded"
                />
                <Label htmlFor="isFree">This bootcamp is free</Label>
              </div>

              {!formData.isFree && (
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <NumberInput
                    id="price"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleFieldChange("price", e.target.value)}
                    placeholder="499.00"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Selection */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    Select Courses
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose courses to include in this bootcamp (
                    {selectedCourses.length} selected)
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {availableCourses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No courses available. Please create courses first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableCourses.map((course) => (
                    <div
                      key={course.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedCourses.includes(course.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleCourseToggle(course.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.id)}
                          onChange={() => {}}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {course.title}
                          </h4>
                          <p className="text-sm text-gray-500">{course.slug}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCourses.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Selected Courses Order:
                  </p>
                  <div className="space-y-2">
                    {selectedCourses.map((courseId, index) => {
                      const course = availableCourses.find(
                        (c) => c.id === courseId
                      );
                      return (
                        <div
                          key={courseId}
                          className="flex items-center gap-3 bg-white p-2 rounded"
                        >
                          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-700">
                            {course?.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 pb-8">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/admin/bootcamps">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Creating…" : "Create Bootcamp"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}