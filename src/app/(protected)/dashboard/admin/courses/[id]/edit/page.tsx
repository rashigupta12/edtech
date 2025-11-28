// src/app/(protected)/dashboard/admin/courses/[id]/edit/page.tsx
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
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

type College = {
  id: string;
  collegeName: string;
};

type Category = {
  id: string;
  name: string;
};

type Course = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  collegeId: string | null;
  thumbnailUrl: string | null;
  previewVideoUrl: string | null;
  duration: string | null;
  level: string;
  language: string;
  prerequisites: string | null;
  isFree: boolean;
  price: number | null;
  discountPrice: number | null;
  maxStudents: number | null;
  status: string;
};

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    categoryId: "",
    collegeId: "",
    thumbnailUrl: "",
    previewVideoUrl: "",
    duration: "",
    level: "Beginner",
    language: "English",
    prerequisites: "",
    isFree: true,
    price: "",
    discountPrice: "",
    maxStudents: "",
  });

  // New outcomes/requirements to add
  const [newOutcomes, setNewOutcomes] = useState<string[]>([]);
  const [newRequirements, setNewRequirements] = useState<string[]>([]);

  // Fetch course data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch course
        const courseRes = await fetch(`/api/courses?id=${params.id}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const courseData = await courseRes.json();

        if (!courseData.success) {
          throw new Error("Course not found");
        }

        const course: Course = courseData.data;

        setFormData({
          title: course.title,
          slug: course.slug,
          shortDescription: course.shortDescription || "",
          description: course.description,
          categoryId: course.categoryId,
          collegeId: course.collegeId || "",
          thumbnailUrl: course.thumbnailUrl || "",
          previewVideoUrl: course.previewVideoUrl || "",
          duration: course.duration || "",
          level: course.level,
          language: course.language,
          prerequisites: course.prerequisites || "",
          isFree: course.isFree,
          price: course.price ? String(course.price) : "",
          discountPrice: course.discountPrice ? String(course.discountPrice) : "",
          maxStudents: course.maxStudents ? String(course.maxStudents) : "",
        });

        // Fetch colleges
        const collegesRes = await fetch("/api/colleges");
        const collegesData = await collegesRes.json();
        if (collegesData.success) {
          setColleges(collegesData.data);
        }

        // Fetch categories
        const categoriesRes = await fetch("/api/categories");
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load course data",
        });
        router.push("/dashboard/admin/courses");
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

  const addNewOutcome = () => {
    setNewOutcomes([...newOutcomes, ""]);
  };

  const removeNewOutcome = (index: number) => {
    setNewOutcomes(newOutcomes.filter((_, i) => i !== index));
  };

  const updateNewOutcome = (index: number, value: string) => {
    const updated = [...newOutcomes];
    updated[index] = value;
    setNewOutcomes(updated);
  };

  const addNewRequirement = () => {
    setNewRequirements([...newRequirements, ""]);
  };

  const removeNewRequirement = (index: number) => {
    setNewRequirements(newRequirements.filter((_, i) => i !== index));
  };

  const updateNewRequirement = (index: number, value: string) => {
    const updated = [...newRequirements];
    updated[index] = value;
    setNewRequirements(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.categoryId) {
      Swal.fire({
        icon: "warning",
        title: "Missing Required Fields",
        text: "Please fill in title and category",
      });
      return;
    }

    setSaving(true);

    const payload = {
      ...formData,
      collegeId: formData.collegeId || null,
      thumbnailUrl: formData.thumbnailUrl || null,
      previewVideoUrl: formData.previewVideoUrl || null,
      prerequisites: formData.prerequisites || null,
      duration: formData.duration || null,
      price: formData.price ? Number(formData.price) : null,
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
      maxStudents: formData.maxStudents ? Number(formData.maxStudents) : null,
    };

    try {
      // Update course basic info
      const res = await fetch(`/api/courses?id=${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await res.json();

      if (response.success) {
        // Add new learning outcomes
        for (const outcome of newOutcomes.filter((o) => o.trim())) {
          await fetch(`/api/courses?id=${params.id}&outcomes=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ outcome }),
          });
        }

        // Add new requirements
        for (const requirement of newRequirements.filter((r) => r.trim())) {
          await fetch(`/api/courses?id=${params.id}&requirements=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requirement }),
          });
        }

        Swal.fire({
          icon: "success",
          title: "Course Updated!",
          text: "Course has been updated successfully",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          router.push("/dashboard/admin/courses");
          router.refresh();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.error?.message || "Failed to update course",
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
          <p className="text-gray-600 mt-4">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/admin/courses"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Course</h1>
              <p className="text-gray-600">Update course details and content.</p>
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
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    placeholder="Web Development Bootcamp"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleFieldChange("slug", e.target.value)}
                    placeholder="web-development-bootcamp"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => handleFieldChange("shortDescription", e.target.value)}
                    placeholder="A brief summary of the course..."
                    rows={2}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    placeholder="Detailed course description..."
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => handleFieldChange("categoryId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => handleFieldChange("level", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={formData.language}
                    onChange={(e) => handleFieldChange("language", e.target.value)}
                    placeholder="English"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleFieldChange("duration", e.target.value)}
                    placeholder="40 hours"
                  />
                </div>

                <div>
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => handleFieldChange("maxStudents", e.target.value)}
                    placeholder="50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-50 border-b">
              <CardTitle className="text-xl text-gray-900">Media</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <Input
                  id="thumbnailUrl"
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => handleFieldChange("thumbnailUrl", e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>

              <div>
                <Label htmlFor="previewVideoUrl">Preview Video URL</Label>
                <Input
                  id="previewVideoUrl"
                  type="url"
                  value={formData.previewVideoUrl}
                  onChange={(e) => handleFieldChange("previewVideoUrl", e.target.value)}
                  placeholder="https://youtube.com/..."
                />
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
                <Label htmlFor="isFree">This course is free</Label>
              </div>

              {!formData.isFree && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleFieldChange("price", e.target.value)}
                      placeholder="99.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="discountPrice">Discount Price ($)</Label>
                    <Input
                      id="discountPrice"
                      type="number"
                      step="0.01"
                      value={formData.discountPrice}
                      onChange={(e) => handleFieldChange("discountPrice", e.target.value)}
                      placeholder="79.00"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Learning Outcomes */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900">Add Learning Outcomes</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Add new learning outcomes to this course
                  </p>
                </div>
                <Button type="button" onClick={addNewOutcome} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Outcome
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {newOutcomes.map((outcome, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={outcome}
                    onChange={(e) => updateNewOutcome(index, e.target.value)}
                    placeholder="What students will learn..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeNewOutcome(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {newOutcomes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No new outcomes to add. Click &quot;Add Outcome&quot; to add one.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Add Requirements */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-gray-900">Add Requirements</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Add new requirements to this course
                  </p>
                </div>
                <Button type="button" onClick={addNewRequirement} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {newRequirements.map((requirement, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={requirement}
                    onChange={(e) => updateNewRequirement(index, e.target.value)}
                    placeholder="Prerequisites for the course..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeNewRequirement(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {newRequirements.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No new requirements to add. Click &quot;Add Requirement&quot; to add one.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="border border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50 border-b">
              <CardTitle className="text-xl text-gray-900">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div>
                <Label htmlFor="prerequisites">Prerequisites</Label>
                <Textarea
                  id="prerequisites"
                  value={formData.prerequisites}
                  onChange={(e) => handleFieldChange("prerequisites", e.target.value)}
                  placeholder="List any prerequisites for this course..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 pb-8">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/admin/courses">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving…" : "Update Course"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}