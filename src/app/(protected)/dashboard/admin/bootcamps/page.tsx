// src/app/(protected)/dashboard/admin/bootcamps/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
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
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  collegeName: string | null;
  thumbnailUrl: string | null;
};

export default function BootcampsPage() {
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [collegeFilter, setCollegeFilter] = useState("ALL");

  // Extract unique colleges
  const colleges = Array.from(
    new Set(bootcamps.map((b) => b.collegeName).filter(Boolean))
  );

  const fetchBootcamps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bootcamps", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      const response = await res.json();

      if (response.success) {
        setBootcamps(response.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch bootcamps:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch bootcamps",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootcamps();
  }, [fetchBootcamps]);

  const handleDelete = async (id: string, title: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      html: `You are about to delete <strong>"${title}"</strong>.<br>This action cannot be undone.`,
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
      const res = await fetch(`/api/bootcamps?id=${id}`, {
        method: "DELETE",
      });

      const response = await res.json();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Bootcamp has been deleted successfully.",
          timer: 2000,
          showConfirmButton: false,
        });
        await fetchBootcamps();
      } else {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: response.error?.message || "Failed to delete bootcamp",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the bootcamp.",
      });
    }
  };

 



  const handlePublish = async (id: string, title: string) => {
    const result = await Swal.fire({
      title: "Publish Bootcamp?",
      html: `Publish <strong>"${title}"</strong> to make it available to students?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, publish it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/bootcamps?id=${id}&publish=true`, {
        method: "PUT",
      });

      const response = await res.json();

      if (response.success) {
        await Swal.fire({
          icon: "success",
          title: "Published!",
          text: "Bootcamp is now live.",
          timer: 2000,
          showConfirmButton: false,
        });
        await fetchBootcamps();
      } else {
        Swal.fire({
          icon: "error",
          title: "Publish Failed",
          text: response.error?.message || "Failed to publish bootcamp",
        });
      }
    } catch (err) {
      console.error("Publish error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while publishing the bootcamp.",
      });
    }
  };



  // Apply all filters
  const filteredBootcamps = bootcamps.filter((bootcamp) => {
    const matchesSearch = bootcamp.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || bootcamp.status === statusFilter;
    const matchesCollege =
      collegeFilter === "ALL" || bootcamp.collegeName === collegeFilter;

    return matchesSearch && matchesStatus && matchesCollege;
  });

  const statusOptions = ["ALL", "DRAFT", "PUBLISHED"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800 border-green-200";
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "PENDING_APPROVAL":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "ARCHIVED":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900">
            Bootcamp Management
          </h2>
          <p className="text-gray-600 mt-2">
            Manage bootcamps, approvals, and multi-course programs across all
            colleges.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            asChild
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Link
              href="/dashboard/admin/bootcamps/create"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Bootcamp
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bootcamps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
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
          <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
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
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Bootcamps
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {bootcamps.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">
                {bootcamps.filter((b) => b.status === "PUBLISHED").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  bootcamps.filter((b) => b.status === "PENDING_APPROVAL")
                    .length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {bootcamps.reduce(
                  (sum, bootcamp) => sum + bootcamp.currentEnrollments,
                  0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading bootcamps...</p>
          </div>
        ) : filteredBootcamps.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No bootcamps found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "ALL" || collegeFilter !== "ALL"
                ? "Try adjusting your search or filter criteria"
                : "Create your first bootcamp to get started!"}
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setCollegeFilter("ALL");
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-50 border-b border-green-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Bootcamp Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Status
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
                {filteredBootcamps.map((bootcamp) => (
                  <tr
                    key={bootcamp.id}
                    className="hover:bg-green-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                            {bootcamp.title}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {bootcamp.description}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(
                                bootcamp.startDate
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(bootcamp.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {bootcamp.collegeName || "Admin"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 border-green-200"
                      >
                        {bootcamp.duration}
                      </Badge>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          bootcamp.status
                        )}`}
                      >
                        {bootcamp.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {bootcamp.isFree ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          `$${bootcamp.price}`
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {bootcamp.currentEnrollments}
                          {bootcamp.maxStudents && ` / ${bootcamp.maxStudents}`}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-2 text-center">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <Link
                          href={`/dashboard/admin/bootcamps/${bootcamp.id}`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-green-50 hover:text-green-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Edit */}
                        <Link
                          href={`/dashboard/admin/bootcamps/${bootcamp.id}/edit`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-amber-50 hover:text-amber-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>

                     

                       

                        {/* Publish (only for approved) */}
                        {bootcamp.status === "APPROVED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-green-50 hover:text-green-700"
                            onClick={() =>
                              handlePublish(bootcamp.id, bootcamp.title)
                            }
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                     

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full text-red-600 hover:bg-red-50"
                          onClick={() =>
                            handleDelete(bootcamp.id, bootcamp.title)
                          }
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
