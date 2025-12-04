
// src/app/(protected)/dashboard/admin/bootcamps/[id]/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  Plus,
  Trash2,
  Users,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

type Bootcamp = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  duration: string;
  startDate: string;
  endDate: string;
  currentEnrollments: number;
  maxStudents: number | null;
  isFree: boolean;
  price: number;
  createdAt: string;
  publishedAt: string | null;
  collegeName: string | null;
  thumbnailUrl: string | null;
};

type Course = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  duration: string | null;
  level: string;
  sortOrder: number;
};

export default function ViewBootcampPage() {
  const params = useParams();
  const router = useRouter();
  const [bootcamp, setBootcamp] = useState<Bootcamp | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!params.id) return;

  const loadBootcampData = async () => {
    try {
      setLoading(true);

      const [bootcampRes, coursesRes] = await Promise.all([
        fetch(`/api/bootcamps?id=${params.id}`),
        fetch(`/api/bootcamps?id=${params.id}&courses=true`),
      ]);

      const bootcampData = await bootcampRes.json();
      const coursesData = await coursesRes.json();

      if (bootcampData.success && bootcampData.data) {
        setBootcamp(bootcampData.data);
      } else {
        throw new Error("Bootcamp not found");
      }

      if (coursesData.success) {
        setCourses(coursesData.data || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Not Found",
        text: "Bootcamp not found",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  loadBootcampData();
}, [params.id, router]); // Only these two dependencies → warning gone

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
      const res = await fetch(`/api/bootcamps?id=${params.id}`, { method: "DELETE" });
      const response = await res.json();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Bootcamp deleted successfully",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/dashboard/admin/bootcamps");
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
        text: "Error deleting bootcamp",
      });
    }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`/api/bootcamps?id=${params.id}&approve=true`, {
        method: "POST",
      });
      const response = await res.json();

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Approved!",
          text: "Bootcamp has been approved.",
          timer: 2000,
          showConfirmButton: false,
        });
        // fetchBootcamp();
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
        text: "Error approving bootcamp",
      });
    }
  };

  const handleReject = async () => {
    const { value: reason } = await Swal.fire({
      title: "Reject Bootcamp",
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
      const res = await fetch(`/api/bootcamps?id=${params.id}&reject=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const response = await res.json();

      if (response.success) {
        Swal.fire("Rejected", "Bootcamp has been rejected.", "success");
        // fetchBootcamp();
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error rejecting bootcamp", "error");
    }
  };

  const handlePublish = async () => {
    try {
      const res = await fetch(`/api/bootcamps?id=${params.id}&publish=true`, {
        method: "PUT",
      });
      const response = await res.json();

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Published!",
          text: "Bootcamp is now live.",
          timer: 2000,
          showConfirmButton: false,
        });
        // fetchBootcamp();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.error?.message || "Publish failed",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error publishing bootcamp", "error");
    }
  };

  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/bootcamps?id=${params.id}&archive=true`, {
        method: "PUT",
      });
      const response = await res.json();

      if (response.success) {
        Swal.fire("Archived", "Bootcamp has been archived.", "success");
        // fetchBootcamp();
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Error archiving bootcamp", "error");
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

  if (loading || !bootcamp) {
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
                href="/dashboard/admin/bootcamps"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Bootcamps
              </Link>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-white">
                  ADMIN VIEW
                </Badge>
                <Badge className={`text-white ${getStatusColor(bootcamp.status)}`}>
                  {bootcamp.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{bootcamp.title}</h1>
              {bootcamp.description && (
                <p className="text-lg text-gray-600 mb-6">{bootcamp.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="bg-white flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(bootcamp.startDate).toLocaleDateString()} - {new Date(bootcamp.endDate).toLocaleDateString()}
              </Badge>
              <Badge variant="outline" className="bg-white">
                {bootcamp.duration}
              </Badge>
              {bootcamp.collegeName && (
                <Badge variant="outline" className="bg-white flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {bootcamp.collegeName}
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
            {/* Course Curriculum */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Bootcamp Curriculum</CardTitle>
                    <CardDescription>{courses.length} courses</CardDescription>
                  </div>
                  <Button asChild size="sm">
                    <Link href={`/dashboard/admin/bootcamps/${bootcamp.id}/edit`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Manage Courses
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No courses added yet.</p>
                    <p className="text-sm mt-2">Add courses to build your bootcamp curriculum.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courses.map((course, index) => (
                      <div
                        key={course.id}
                        className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{course.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{course.level}</span>
                            {course.duration && <span>{course.duration}</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/admin/courses/${course.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Enrolled Students</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {bootcamp.currentEnrollments}
                        {bootcamp.maxStudents && ` / ${bootcamp.maxStudents}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Courses</p>
                      <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Pricing & Actions */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-50">
                <CardTitle>Bootcamp Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold text-green-600">
                      {bootcamp.isFree ? "Free" : `$${bootcamp.price}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium">
                      {new Date(bootcamp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {bootcamp.publishedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Published</span>
                      <span className="font-medium">
                        {new Date(bootcamp.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{bootcamp.duration}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/bootcamps/${bootcamp.slug}`} target="_blank">
                      <Eye className="h-4 w-4 mr-2" />
                      View Live Page
                    </Link>
                  </Button>

                  <Button
                    asChild
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Link href={`/dashboard/admin/bootcamps/${bootcamp.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Bootcamp
                    </Link>
                  </Button>

                  {bootcamp.status === "PENDING_APPROVAL" && (
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

                  {bootcamp.status === "APPROVED" && (
                    <Button
                      onClick={handlePublish}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish
                    </Button>
                  )}

                  {(bootcamp.status === "PUBLISHED" || bootcamp.status === "APPROVED") && (
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
                    Delete Bootcamp
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
                    {bootcamp.id.slice(0, 8)}...
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slug</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {bootcamp.slug}
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