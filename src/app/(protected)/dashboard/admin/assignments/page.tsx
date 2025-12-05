/*eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, Edit, FileText, Trash2, Plus, Search } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle?: string;
  dueDate: string | null;
  maxScore: number;
  status: string;
  submissionCount?: number;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [filters, setFilters] = useState({
    courseId: "",
    status: "",
  });

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.courseId) params.append("courseId", filters.courseId);

        const url = params.toString()
          ? `/api/assignments?${params}`
          : "/api/assignments";

        const response = await fetch(url);
        const result: ApiResponse<Assignment[]> = await response.json();

        if (result.success && result.data) {
          setAssignments(result.data);
        } else {
          setError(result.error?.message || "Failed to fetch assignments");
        }
      } catch (err) {
        setError("Failed to fetch assignments");
        console.error("Error fetching assignments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [filters]);

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const response = await fetch(`/api/assignments?id=${assignmentId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setAssignments(assignments.filter((a) => a.id !== assignmentId));
      } else {
        alert(result.error?.message || "Failed to delete assignment");
      }
    } catch (err) {
      alert("Failed to delete assignment");
      console.error("Error deleting assignment:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "ARCHIVED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Assignments
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Manage all assignments across courses
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Course ID..."
                  value={filters.courseId}
                  onChange={(e) =>
                    setFilters({ ...filters, courseId: e.target.value })
                  }
                  className="pl-9 pr-3 py-2 w-48 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                />
              </div>
              <Link
                href="/dashboard/admin/assignments/create"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
              >
                <Plus className="h-4 w-4" />
                Create
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Assignments List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-emerald-100">
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-emerald-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No assignments found
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first assignment.
              </p>
              <Link
                href="/dashboard/admin/assignments/create"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <Plus className="h-4 w-4" />
                Create Assignment
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                      Max Score
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-emerald-100">
                  {assignments.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className=" transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                            {assignment.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900">
                        {assignment.courseTitle || assignment.courseId}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900">
                        {assignment.dueDate
                          ? new Date(assignment.dueDate).toLocaleDateString()
                          : "No due date"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900 font-medium">
                        {assignment.maxScore}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {/* View Assignment */}
                          <Link
                            href={`/dashboard/admin/assignments/${assignment.id}`}
                            className="p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="View Assignment"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {/* Edit Assignment */}
                          <Link
                            href={`/dashboard/admin/assignments/${assignment.id}/edit`}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Edit Assignment"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>

                          {/* View Submissions */}
                          <Link
                            href={`/dashboard/admin/assignments/${assignment.id}/submissions`}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded-lg transition-colors"
                            title="View Submissions"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>

                          {/* Delete Assignment */}
                          <button
                            onClick={() => deleteAssignment(assignment.id)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Assignment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
    </div>
  );
}
