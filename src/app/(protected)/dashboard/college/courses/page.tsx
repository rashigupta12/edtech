"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

type Course = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  status: string;
  level: string;
  duration: string;
  isFeatured: boolean;
  isFree: boolean;
  price: number;
  currentEnrollments: number;
  createdAt: string;
  collegeName: string | null;
  categoryName: string | null;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [collegeFilter, setCollegeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");

  // Extract unique values for filters
  const colleges = Array.from(new Set(courses.map(c => c.collegeName).filter(Boolean)));
  // const categories = Array.from(new Set(courses.map(c => c.categoryName).filter(Boolean)));

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/courses", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const response = await res.json();
      
      if (response.success) {
        setCourses(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch courses",
        confirmButtonColor: "#059669",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = async (id: string, title: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `You are about to delete <strong>"${title}"</strong>.<br>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/courses?id=${id}`, { 
        method: "DELETE" 
      });
      
      const response = await res.json();
      
      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Course has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
        await fetchCourses();
      } else {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: response.error?.message || "Failed to delete course",
          confirmButtonColor: "#059669",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the course.",
        confirmButtonColor: "#059669",
      });
    }
  };

  const handleApprove = async (id: string, title: string) => {
    const result = await Swal.fire({
      title: "Approve Course?",
      html: `Approve <strong>"${title}"</strong> for publishing?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, approve it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/courses?id=${id}&approve=true`, {
        method: "POST",
      });

      const response = await res.json();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Approved!",
          text: "Course has been approved.",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
        await fetchCourses();
      } else {
        Swal.fire({
          icon: "error",
          title: "Approval Failed",
          text: response.error?.message || "Failed to approve course",
          confirmButtonColor: "#059669",
        });
      }
    } catch (err) {
      console.error("Approve error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while approving the course.",
        confirmButtonColor: "#059669",
      });
    }
  };

  const handleReject = async (id: string, title: string) => {
    const { value: reason } = await Swal.fire({
      title: "Reject Course",
      html: `Reject <strong>"${title}"</strong>?`,
      input: "textarea",
      inputLabel: "Rejection Reason",
      inputPlaceholder: "Please provide a reason for rejection...",
      inputAttributes: {
        "aria-label": "Rejection reason",
      },
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Reject Course",
      inputValidator: (value) => {
        if (!value) {
          return "You need to provide a reason!";
        }
      },
    });

    if (!reason) return;

    try {
      const res = await fetch(`/api/courses?id=${id}&reject=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const response = await res.json();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Rejected!",
          text: "Course has been rejected.",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
        await fetchCourses();
      } else {
        Swal.fire({
          icon: "error",
          title: "Rejection Failed",
          text: response.error?.message || "Failed to reject course",
          confirmButtonColor: "#059669",
        });
      }
    } catch (err) {
      console.error("Reject error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while rejecting the course.",
        confirmButtonColor: "#059669",
      });
    }
  };

  const handlePublish = async (id: string, title: string) => {
    const result = await Swal.fire({
      title: "Publish Course?",
      html: `Publish <strong>"${title}"</strong> to make it available to students?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, publish it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/courses?id=${id}&publish=true`, {
        method: "PUT",
      });

      const response = await res.json();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Published!",
          text: "Course is now live.",
          timer: 2000,
          showConfirmButton: false,
          confirmButtonColor: "#059669",
        });
        await fetchCourses();
      } else {
        Swal.fire({
          icon: "error",
          title: "Publish Failed",
          text: response.error?.message || "Failed to publish course",
          confirmButtonColor: "#059669",
        });
      }
    } catch (err) {
      console.error("Publish error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while publishing the course.",
        confirmButtonColor: "#059669",
      });
    }
  };

 

  // Apply all filters
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || course.status === statusFilter;
    const matchesCollege = collegeFilter === "ALL" || course.collegeName === collegeFilter;
    const matchesCategory = categoryFilter === "ALL" || course.categoryName === categoryFilter;
    const matchesLevel = levelFilter === "ALL" || course.level === levelFilter;
    
    return matchesSearch && matchesStatus && matchesCollege && matchesCategory && matchesLevel;
  });

  const statusOptions = [
    "ALL",
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "PUBLISHED",
    "REJECTED",
   
  ];

  const levelOptions = ["ALL", "Beginner", "Intermediate", "Advanced"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900">Course Management</h2>
          <p className="text-gray-600 mt-2">
            Manage courses, approvals, and content across all colleges.
          </p>
        </div>

        <div className="flex gap-3">
          {/* <Button
            asChild
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <Link href="/dashboard/college/categories" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Categories
            </Link>
          </Button> */}
          
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Link href="/dashboard/college/courses/create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Course
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* College Filter */}
        <Select value={collegeFilter} onValueChange={setCollegeFilter}>
          <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
            <SelectValue placeholder="All Colleges" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Colleges</SelectItem>
            {colleges.map((college, idx) => (
              <SelectItem key={`${college}-${idx}`} value={college!}>
                {college}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Level Filter */}
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            {levelOptions.map((level) => (
              <SelectItem key={level} value={level}>
                {level === "ALL" ? "All Levels" : level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-xl font-bold text-gray-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-xl font-bold text-gray-900">
                {courses.filter((c) => c.status === "PUBLISHED").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {courses.filter((c) => c.status === "PENDING_APPROVAL").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-xl font-bold text-gray-900">
                {courses.reduce((sum, course) => sum + course.currentEnrollments, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "ALL" || collegeFilter !== "ALL"
                ? "Try adjusting your search or filter criteria"
                : "Create your first course to get started!"}
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setCollegeFilter("ALL");
                setCategoryFilter("ALL");
                setLevelFilter("ALL");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Course Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                              {course.title}
                            </div>
                            {course.isFeatured && (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">{course.shortDescription}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs border-gray-300">
                              {course.categoryName || "Uncategorized"}
                            </Badge>
                            <span className="text-xs text-gray-500">{course.duration}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {course.collegeName || "Admin"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          course.status
                        )}`}
                      >
                        {course.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                        {course.level}
                      </Badge>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {course.isFree ? (
                          <span className="text-emerald-600">Free</span>
                        ) : (
                          `${course.price}`
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {course.currentEnrollments}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-2 text-center">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <Link href={`/dashboard/college/courses/${course.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Edit */}
                        <Link href={`/dashboard/college/courses/${course.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Approve (only for pending) */}
                        {course.status === "PENDING_APPROVAL" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => handleApprove(course.id, course.title)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Reject (only for pending) */}
                        {course.status === "PENDING_APPROVAL" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleReject(course.id, course.title)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Publish (only for approved) */}
                        {course.status === "APPROVED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => handlePublish(course.id, course.title)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                     

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(course.id, course.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}