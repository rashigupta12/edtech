/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/(protected)/dashboard/admin/courses/[id]/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  ListTree,
  Plus,
  Save,
  Star,
  Trash2,
  Users,
  X,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

type Course = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  status: string;
  level: string;
  duration: string;
  language: string;
  isFeatured: boolean;
  isFree: boolean;
  price: number;
  discountPrice: number | null;
  maxStudents: number | null;
  currentEnrollments: number;
  createdAt: string;
  publishedAt: string | null;
  collegeName: string | null;
  categoryName: string | null;
  thumbnailUrl: string | null;
  previewVideoUrl: string | null;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
};

export default function ViewCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
  });

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/courses?id=${params.id}`);
      const response = await res.json();

      if (response.success) {
        setCourse(response.data);
      } else {
        throw new Error("Course not found");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Not Found",
        text: "Course not found",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch(`/api/courses?id=${params.id}&modules=true`);
      const response = await res.json();

      if (response.success) {
        setModules(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch modules:", err);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchCourse();
      fetchModules();
    }
  }, [params.id]);

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/courses?id=${params.id}`, { method: "DELETE" });
      const response = await res.json();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Course deleted successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/dashboard/admin/courses");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.error?.message || "Delete failed",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error deleting course",
      });
    }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`/api/courses?id=${params.id}&approve=true`, {
        method: "POST",
      });
      const response = await res.json();

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Approved!",
          text: "Course has been approved.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchCourse();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.error?.message || "Approval failed",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error approving course",
      });
    }
  };

  const handleReject = async () => {
    const { value: reason } = await Swal.fire({
      title: "Reject Course",
      input: "textarea",
      inputLabel: "Rejection Reason",
      inputPlaceholder: "Please provide a reason for rejection...",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to provide a reason!";
        }
      },
    });

    if (!reason) return;

    try {
      const res = await fetch(`/api/courses?id=${params.id}&reject=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const response = await res.json();

      if (response.success) {
        Swal.fire("Rejected", "Course has been rejected.", "success");
        fetchCourse();
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error rejecting course", "error");
    }
  };

  const handlePublish = async () => {
    try {
      const res = await fetch(`/api/courses?id=${params.id}&publish=true`, {
        method: "PUT",
      });
      const response = await res.json();

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Published!",
          text: "Course is now live.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchCourse();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.error?.message || "Publish failed",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error publishing course", "error");
    }
  };

  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/courses?id=${params.id}&archive=true`, {
        method: "PUT",
      });
      const response = await res.json();

      if (response.success) {
        Swal.fire("Archived", "Course has been archived.", "success");
        fetchCourse();
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error archiving course", "error");
    }
  };

  const handleAddModule = () => {
    setShowModuleForm(true);
    setEditingModule(null);
    setModuleForm({ title: "", description: "" });
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      description: module.description || "",
    });
    setShowModuleForm(true);
  };

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) {
      Swal.fire("Error", "Module title is required", "error");
      return;
    }

    try {
      const res = await fetch(`/api/courses?id=${params.id}&modules=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleForm),
      });

      const response = await res.json();

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Module Added!",
          timer: 1500,
          showConfirmButton: false,
        });
        setShowModuleForm(false);
        setModuleForm({ title: "", description: "" });
        fetchModules();
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add module", "error");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-500",
      PENDING_APPROVAL: "bg-yellow-500",
      APPROVED: "bg-blue-500",
      PUBLISHED: "bg-green-500",
      REJECTED: "bg-red-500",
      ARCHIVED: "bg-purple-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="relative py-8 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/dashboard/admin/courses"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Courses
              </Link>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-white">
                  ADMIN VIEW
                </Badge>
                <Badge className={`text-white ${getStatusColor(course.status)}`}>
                  {course.status.replace(/_/g, " ")}
                </Badge>
                {course.isFeatured && (
                  <Badge className="bg-yellow-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
              {course.shortDescription && (
                <p className="text-lg text-gray-600 mb-6">{course.shortDescription}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="bg-white">
                {course.categoryName || "Uncategorized"}
              </Badge>
              <Badge variant="outline" className="bg-white">
                {course.level}
              </Badge>
              <Badge variant="outline" className="bg-white">
                {course.language}
              </Badge>
              {course.collegeName && (
                <Badge variant="outline" className="bg-white flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {course.collegeName}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50">
                <CardTitle>Course Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {course.description || "No description provided."}
                </p>

                <div className="grid sm:grid-cols-2 gap-6 mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-semibold">{course.duration || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Enrolled</p>
                      <p className="font-semibold">
                        {course.currentEnrollments}
                        {course.maxStudents && ` / ${course.maxStudents}`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Curriculum */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Course Curriculum</CardTitle>
                    <CardDescription>{modules.length} modules</CardDescription>
                  </div>
                  <Button onClick={handleAddModule} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {showModuleForm && (
                  <Card className="mb-4 border-2 border-blue-200">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <Label>Module Title *</Label>
                        <Input
                          value={moduleForm.title}
                          onChange={(e) =>
                            setModuleForm({ ...moduleForm, title: e.target.value })
                          }
                          placeholder="Introduction to Web Development"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={moduleForm.description}
                          onChange={(e) =>
                            setModuleForm({ ...moduleForm, description: e.target.value })
                          }
                          placeholder="Module description..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveModule} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save Module
                        </Button>
                        <Button
                          onClick={() => setShowModuleForm(false)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {modules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ListTree className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No modules added yet.</p>
                    <p className="text-sm mt-2">Add modules to structure your course content.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {modules.map((module, index) => (
                      <div
                        key={module.id}
                        className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{module.title}</h4>
                          {module.description && (
                            <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditModule(module)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing & Actions */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-50">
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-green-600">
                      {course.isFree ? "Free" : `$${course.price}`}
                    </span>
                    {!course.isFree && course.discountPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        ${course.discountPrice}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {course.publishedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Published</span>
                      <span className="font-medium">
                        {new Date(course.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/courses/${course.slug}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      View Live Page
                    </Link>
                  </Button>

                  <Button
                    asChild
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Link href={`/dashboard/admin/courses/${course.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Course
                    </Link>
                  </Button>

                  {course.status === "PENDING_APPROVAL" && (
                    <>
                      <Button
                        onClick={handleApprove}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={handleReject}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}

                  {course.status === "APPROVED" && (
                    <Button
                      onClick={handlePublish}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish
                    </Button>
                  )}

                  {(course.status === "PUBLISHED" || course.status === "APPROVED") && (
                    <Button
                      onClick={handleArchive}
                      variant="outline"
                      className="w-full"
                    >
                      Archive
                    </Button>
                  )}

                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Course
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Technical Info */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-50">
                <CardTitle className="text-lg">Technical Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {course.id.slice(0, 8)}...
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slug</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {course.slug}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}