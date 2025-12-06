// app/dashboard/faculty/assessments/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Search,

  Plus,

  Trash2,
  Eye,

  FileText,
  BookOpen,
  Award,
 
  XCircle,
  
 
  ChevronDown,
  AlertCircle,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/auth";

// Types
interface Assessment {
  id: string;
  title: string;
  description: string | null;
  assessmentLevel: "LESSON_QUIZ" | "MODULE_ASSESSMENT" | "COURSE_FINAL";
  courseId: string;
  courseTitle?: string;
  moduleTitle?: string | null;
  lessonTitle?: string | null;
  duration: number | null;
  passingScore: number;
  maxAttempts: number | null;
  timeLimit: number | null;
  isRequired: boolean;
  showCorrectAnswers: boolean;
  allowRetake: boolean;
  randomizeQuestions: boolean;
  createdBy: string; // Added this field
  createdAt: string;
  updatedAt: string;
}

interface AssessmentResponse {
  success: boolean;
  data: Assessment[];
  message?: string;
}

const AssessmentsPage = () => {
  const router = useRouter();
  const user = useCurrentUser(); // Get current user
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] =
    useState<Assessment | null>(null);

  // Action menu
  const [, setActionMenuOpen] = useState<string | null>(null);

  // Check if user can edit assessment
  const canEditAssessment = (assessment: Assessment) => {
    return user?.id === assessment.createdBy;
  };

  // Fetch assessments
  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/assessments");

      if (!response.ok) {
        throw new Error("Failed to fetch assessments");
      }

      const data: AssessmentResponse = await response.json();

      if (data.success && data.data) {
        setAssessments(data.data);
        setFilteredAssessments(data.data);
      } else {
        throw new Error(data.message || "Failed to load assessments");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = assessments;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (assessment) =>
          assessment.title.toLowerCase().includes(term) ||
          assessment.description?.toLowerCase().includes(term) ||
          assessment.courseTitle?.toLowerCase().includes(term)
      );
    }

    // Apply level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter(
        (assessment) => assessment.assessmentLevel === levelFilter
      );
    }

    setFilteredAssessments(filtered);
    setCurrentPage(1);
  }, [assessments, searchTerm, levelFilter, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchAssessments();
  }, []);

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssessments = filteredAssessments.slice(startIndex, endIndex);

  // Handlers
  const handleCreateAssessment = () => {
    router.push("/dashboard/faculty/assessments/create");
  };

  const handleViewAssessment = (id: string) => {
    router.push(`/dashboard/faculty/assessments/${id}`);
  };

  const handleEditAssessment = (assessment: Assessment) => {
    if (!canEditAssessment(assessment)) {
      setError("You can only edit assessments created by you");
      return;
    }
    router.push(`/dashboard/faculty/assessments/${assessment.id}/edit`);
    setActionMenuOpen(null);
  };

  const openDeleteModal = (assessment: Assessment) => {
    if (!canEditAssessment(assessment)) {
      setError("You can only delete assessments created by you");
      return;
    }
    setAssessmentToDelete(assessment);
    setDeleteModalOpen(true);
    setActionMenuOpen(null);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setAssessmentToDelete(null);
  };

  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return;

    try {
      const response = await fetch(
        `/api/assessments?id=${assessmentToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchAssessments();
        closeDeleteModal();
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete assessment");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete assessment"
      );
    }
  };

 

  const getAssessmentLevelIcon = (level: string) => {
    switch (level) {
      case "LESSON_QUIZ":
        return <FileText className="w-4 h-4" />;
      case "MODULE_ASSESSMENT":
        return <BookOpen className="w-4 h-4" />;
      case "COURSE_FINAL":
        return <Award className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getAssessmentLevelColor = (level: string) => {
    switch (level) {
      case "LESSON_QUIZ":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "MODULE_ASSESSMENT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COURSE_FINAL":
        return "bg-violet-100 text-violet-800 border-violet-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
            <p className="text-gray-600 mt-1">
              Manage and create assessments for your courses
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative w-48">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition w-full"
            >
              <option value="all">All Types</option>
              <option value="LESSON_QUIZ">Lesson Quiz</option>
              <option value="MODULE_ASSESSMENT">Module Assessment</option>
              <option value="COURSE_FINAL">Course Final</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={handleCreateAssessment}
            className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Assessment
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Assessments Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-emerald-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <FileText className="w-12 h-12 mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">
                          No assessments found
                        </p>
                        <p className="text-gray-400">
                          {searchTerm || levelFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Create your first assessment to get started"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentAssessments.map((assessment) => (
                    <tr
                      key={assessment.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {assessment.title}
                          </p>
                          {assessment.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {assessment.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {assessment.courseTitle || "N/A"}
                        </div>
                        {(assessment.moduleTitle || assessment.lessonTitle) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {assessment.moduleTitle || assessment.lessonTitle}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAssessmentLevelColor(
                              assessment.assessmentLevel
                            )}`}
                          >
                            {getAssessmentLevelIcon(assessment.assessmentLevel)}
                            <span className="ml-1.5">
                              {assessment.assessmentLevel
                                .replace(/_/g, " ")
                                .toLowerCase()}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(assessment.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* View Icon */}
                          <button
                            onClick={() => handleViewAssessment(assessment.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-600 group-hover:text-emerald-600" />
                          </button>

                          {/* Edit Icon - Only show if user created this assessment */}
                          {canEditAssessment(assessment) && (
                            <button
                              onClick={() => handleEditAssessment(assessment)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                              title="Edit Assessment"
                            >
                              <Edit className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                            </button>
                          )}

                       

                          {/* Delete Icon - Only show if user created this assessment */}
                          {canEditAssessment(assessment) && (
                            <button
                              onClick={() => openDeleteModal(assessment)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                              title="Delete Assessment"
                            >
                              <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && assessmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Assessment
                </h3>
                <p className="text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-medium">
                {assessmentToDelete.title}
              </p>
              {assessmentToDelete.courseTitle && (
                <p className="text-red-600 text-sm mt-1">
                  Course: {assessmentToDelete.courseTitle}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAssessment}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
              >
                Delete Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentsPage;