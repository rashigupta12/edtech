/*eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(protected)/dashboard/admin/courses/page.tsx
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
import {
  BookOpen,
  Edit,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
  Users
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

type Course = {
  id: string;
  slug: string;
  title: string;
  status: string;
  price: number;
  forexPrice: number;
  enrollmentCount: number;
  createdAt: string;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Use useCallback to memoize the fetch function
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        statusFilter === "ALL"
          ? "/api/admin/courses"
          : `/api/admin/courses?status=${statusFilter}`;

      // Add cache busting parameter
      const cacheBuster = `?_=${new Date().getTime()}`;
      const fetchUrl = url.includes("?")
        ? `${url}&_=${new Date().getTime()}`
        : `${url}${cacheBuster}`;

      const res = await fetch(fetchUrl, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const data = await res.json();

      const mapped: Course[] = (data.courses || []).map((c: any) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        status: c.status,
        price: Number(c.priceINR || 0),
        forexPrice: Number(c.priceUSD || 0),
        enrollmentCount: c.currentEnrollments ?? 0,
        createdAt: c.createdAt,
      }));

      setCourses(mapped);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch courses on mount and when status filter changes
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Delete handler with immediate refresh
  const handleDelete = async (id: string) => {
    const courseToDelete = courses.find((c) => c.id === id);

    const result = await Swal.fire({
      title: "Are you sure?",
      html: `You are about to delete <strong>"${courseToDelete?.title}"</strong>.<br>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Course has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });

        // Immediately refresh the courses list
        await fetchCourses();
      } else {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: "Failed to delete course. Please try again.",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the course.",
      });
    }
  };

  // Filter by search
  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions = [
    "ALL",
    "DRAFT",
    "UPCOMING",
    "REGISTRATION_OPEN",
    "ONGOING",
    "COMPLETED",
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGISTRATION_OPEN":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ONGOING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "UPCOMING":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-blue-700 bg-clip-text text-transparent">
            Course Management
          </h2>
          <p className="text-gray-600 mt-2">
            Manage your courses, create new ones, and track enrollment.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s} className="focus:bg-blue-50">
                  {s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add Course Button */}
          <Button
            asChild
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg whitespace-nowrap"
          >
            <Link
              href="/dashboard/admin/courses/add"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600">
                Total Enrollments
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.reduce(
                  (sum, course) => sum + course.enrollmentCount,
                  0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
              <Filter className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Filters
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {statusFilter === "ALL"
                  ? "All"
                  : statusFilter.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "ALL"
                ? "Try adjusting your search or filter criteria"
                : "Create your first course to get started!"}
            </p>
            {searchTerm || statusFilter !== "ALL" ? (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                <Link
                  href="/dashboard/admin/courses/add"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Course
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-500 text-white border-b border-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Course Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold  uppercase tracking-wider">
                    Enrollments
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold  uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {course.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {course.slug}
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
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{course.price.toLocaleString("en-IN")}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${course.forexPrice.toLocaleString()}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {course.enrollmentCount}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(course.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-6 py-2 text-center">
                      <div className="flex items-center justify-end ">
                        {/* View */}
                        <Link href={`/dashboard/admin/courses/${course.slug}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Edit */}
                        <Link
                          href={`/dashboard/admin/courses/edit/${course.slug}`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(course.id)}
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
