/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/(protected)/dashboard/college/courses/[id]/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  ChevronDown,
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
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

type LearningOutcome = {
  id: string;
  outcome: string;
  sortOrder: number;
};

type Requirement = {
  id: string;
  requirement: string;
  sortOrder: number;
};

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
  outcomes?: LearningOutcome[]; // Add this
  requirements?: Requirement[];
  previewVideoUrl: string | null;
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  videoUrl: string | null;
  videoDuration: number | null;
  articleContent: string | null;
  isFree: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: Lesson[];
};

export default function ViewCoursePage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
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
  const fetchCurriculum = async () => {
    try {
      const res = await fetch(`/api/courses?id=${params.id}&curriculum=true`);
      const response = await res.json();

      if (response.success) {
        setModules(response.data.modules || []);
      } else {
        console.error("Failed to fetch curriculum:", response.error);
      }
    } catch (err) {
      console.error("Failed to fetch curriculum:", err);
    }
  };

  const fetchModulesWithLessons = async () => {
    try {
      // First get modules
      const modulesRes = await fetch(
        `/api/courses?id=${params.id}&modules=true`
      );
      const modulesData = await modulesRes.json();

      if (modulesData.success) {
        const modulesWithLessons = await Promise.all(
          modulesData.data.map(async (module: Module) => {
            // Then get lessons for each module
            const lessonsRes = await fetch(
              `/api/courses?id=${params.id}&moduleId=${module.id}&lessons=true`
            );
            const lessonsData = await lessonsRes.json();

            return {
              ...module,
              lessons: lessonsData.success ? lessonsData.data : [],
            };
          })
        );
        setModules(modulesWithLessons);
      }
    } catch (err) {
      console.error("Failed to fetch modules with lessons:", err);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchCourse();
      fetchCurriculum();
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
      const res = await fetch(`/api/courses?id=${params.id}`, {
        method: "DELETE",
      });
      const response = await res.json();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Course deleted successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/dashboard/college/courses");
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
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
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
      fetchCurriculum(); // Change this from fetchModules() to fetchCurriculum()
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
                href="/dashboard/college/courses"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Courses
              </Link>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-white">
                  ADMIN VIEW
                </Badge>
                <Badge
                  className={`text-white ${getStatusColor(course.status)}`}
                >
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
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>
              {course.shortDescription && (
                <p className="text-lg text-gray-600 mb-6">
                  {course.shortDescription}
                </p>
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
                <Badge
                  variant="outline"
                  className="bg-white flex items-center gap-1"
                >
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
                      <p className="font-semibold">
                        {course.duration || "Not specified"}
                      </p>
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
            {/* Learning Outcomes */}
            {course.outcomes && course.outcomes.length > 0 && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-50">
                  <CardTitle>Learning Outcomes</CardTitle>
                  <CardDescription>
                    What students will learn from this course
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {course.outcomes.map((outcome, index) => (
                      <li key={outcome.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{outcome.outcome}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-50">
                  <CardTitle>Requirements</CardTitle>
                  <CardDescription>
                    What students need before taking this course
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {course.requirements.map((requirement, index) => (
                      <li
                        key={requirement.id}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">
                          {requirement.requirement}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

           {/* Curriculum */}
<Card>
  <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-50">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Course Curriculum</CardTitle>
        <CardDescription>
          {modules?.length || 0} modules • {modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0} lessons
        </CardDescription>
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

    {!modules || modules.length === 0 ? (
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
            className="border rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Module Header */}
            <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => toggleModule(module.id)}>
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm mt-1">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{module.title}</h4>
                {module.description && (
                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>{module.lessons?.length || 0} lessons</span>
                  <span>•</span>
                  <span>Sort order: {module.sortOrder}</span>
                </div>
              </div>
              {/* <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditModule(module);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button> */}
              <ChevronDown
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  expandedModules.includes(module.id) ? 'rotate-180' : ''
                }`} 
              />
            </div>

            {/* Lessons Section */}
            {expandedModules.includes(module.id) && (
              <div className="border-t bg-gray-50">
                {!module.lessons || module.lessons.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No lessons in this module yet.
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id}
                        className="flex items-start gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-semibold mt-1">
                          {lessonIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 text-sm">
                                {lesson.title}
                              </h5>
                              {lesson.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                            {lesson.isFree && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                Free
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <Badge variant="outline" className="text-xs">
                              {lesson.contentType}
                            </Badge>
                            {lesson.videoDuration && (
                              <>
                                <span>•</span>
                                <span>{Math.floor(lesson.videoDuration / 60)}m {lesson.videoDuration % 60}s</span>
                              </>
                            )}
                            <span>•</span>
                            <span>Sort: {lesson.sortOrder}</span>
                          </div>
                          {lesson.contentType === "VIDEO" && lesson.videoUrl && (
                            <div className="mt-2">
                              <a 
                                href={lesson.videoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                📹 Video Link
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
                    <Link href={`/dashboard/college/courses/${course.id}/edit`}>
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

                  {(course.status === "PUBLISHED" ||
                    course.status === "APPROVED") && (
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
