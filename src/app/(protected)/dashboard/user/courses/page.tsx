/*eslint-disable @typescript-eslint/no-unused-vars */
// src/app/dashboard/user/courses/page.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/auth";
import {
  BookOpen,
  PlayCircle,
  ChevronRight,
  BarChart3,
  Calendar,
  Target,
  Sparkles,
  Award,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CourseEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
  status: "ACTIVE" | "COMPLETED" | "DROPPED" | "EXPIRED";
  progress: number;
  enrolledAt: string;
  lastAccessedAt: string | null;
  completedAt: string | null;
  overallScore: number | null;
  certificateEligible: boolean;
  certificateIssued: boolean;
  completedLessons: number;
  totalLessons: number;
  completedAssessments: number;
  totalAssessments: number;
}

interface Stats {
  total: number;
  active: number;
  completed: number;
}

export default function UserCoursesPage() {
  const user = useCurrentUser();
  const router = useRouter();
  const userId = user?.id;

  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchEnrollments();
  }, [userId]);

  const fetchEnrollments = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch enrollments with progress
      const res = await fetch(`/api/enrollments?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        const enrollmentsData = data.data || [];
        setEnrollments(enrollmentsData);
      }

      // Fetch stats
      const res2 = await fetch(`/api/enrollments?stats=true&userId=${userId}`);
      const data2 = await res2.json();
      setStats(data2.data || { total: 0, active: 0, completed: 0 });
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh progress for a specific course
  const refreshProgress = async (courseId: string, enrollmentId: string) => {
    if (!userId) return;

    setRefreshing(courseId);
    try {
      // Trigger progress recalculation
      const response = await fetch(
        `/api/progress?userId=${userId}&courseId=${courseId}`
      );
      if (response.ok) {
        const data = await response.json();

        // Update local state with new progress
        setEnrollments((prev) =>
          prev.map((enrollment) =>
            enrollment.courseId === courseId
              ? {
                  ...enrollment,
                  progress: data.data?.overallProgress || enrollment.progress,
                  completedLessons:
                    data.data?.completedLessons || enrollment.completedLessons,
                  totalLessons:
                    data.data?.totalLessons || enrollment.totalLessons,
                  completedAssessments:
                    data.data?.completedAssessments ||
                    enrollment.completedAssessments,
                  totalAssessments:
                    data.data?.totalAssessments || enrollment.totalAssessments,
                }
              : enrollment
          )
        );
      }
    } catch (error) {
      console.error("Error refreshing progress:", error);
    } finally {
      setRefreshing(null);
    }
  };

  // Get completion status text
  const getCompletionStatus = (enrollment: CourseEnrollment) => {
    if (enrollment.status === "COMPLETED") {
      return "Course Completed";
    }

    const lessonText = `${enrollment.completedLessons}/${enrollment.totalLessons} lessons`;
    const assessmentText =
      enrollment.totalAssessments > 0
        ? ` • ${enrollment.completedAssessments}/${enrollment.totalAssessments} assessments`
        : "";

    return `Progress: ${lessonText}${assessmentText}`;
  };

  // Get badge variant based on status
  const getStatusBadgeVariant = (status: CourseEnrollment["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "ACTIVE":
        return "secondary";
      case "DROPPED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get badge text based on status
  const getStatusBadgeText = (status: CourseEnrollment["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "Completed";
      case "ACTIVE":
        return "In Progress";
      case "DROPPED":
        return "Dropped";
      default:
        return "Expired";
    }
  };

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-60 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-900 to-green-600 rounded-xl shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-900 to-gray-700 bg-clip-text text-transparent">
                My Learning Journey
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Track your progress and continue where you left off
            </p>
          </div>
          <Button
            className="group bg-gradient-to-r from-green-700 to-emerald-900 hover:from-green-700 hover:to-emerald-900 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            asChild
          >
            <Link href="/courses" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Explore New Courses
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-bl-full" />
            <CardContent className="pt-8 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl w-fit shadow-md">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Total Courses
                    </p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">
                      {stats.total}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">
                    All Time
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-bl-full" />
            <CardContent className="pt-8 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl w-fit shadow-md">
                    <PlayCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      In Progress
                    </p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">
                      {stats.active}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium">
                    Active
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-bl-full" />
            <CardContent className="pt-8 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl w-fit shadow-md">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">
                      Completed
                    </p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">
                      {stats.completed}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-medium">
                    Achieved
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course List Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Courses</h2>
              <p className="text-gray-600">
                Manage and track your enrolled courses
              </p>
            </div>
            <Button
              variant="outline"
              onClick={fetchEnrollments}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          {enrollments.length === 0 ? (
            <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Start Your Learning Journey
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  You haven&apos;t enrolled in any courses yet. Explore our
                  catalog and begin your path to knowledge.
                </p>
                <Button
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl px-8 py-6 text-lg"
                  asChild
                >
                  <Link href="/courses" className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Discover Courses
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {enrollments.map((course) => (
                <Card
                  key={course.id}
                  className="group overflow-hidden bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Course Thumbnail */}
                    <div className="lg:w-80 relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 min-h-[240px]">
                      {course.courseThumbnail ? (
                        <img
                          // src={course.courseThumbnail}
                          src="https://blog.zegocloud.com/wp-content/uploads/2024/03/types-of-web-development-services.jpg"
                          alt={course.courseTitle}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="relative">
                            <BookOpen className="h-24 w-24 text-gray-300" />
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-xl" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge
                          variant={getStatusBadgeVariant(course.status)}
                          className={`
                            px-3 py-1.5 text-sm font-medium rounded-full shadow-md
                            ${
                              course.status === "COMPLETED"
                                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                                : course.status === "ACTIVE"
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                                : course.status === "DROPPED"
                                ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                                : "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                            }
                          `}
                        >
                          {getStatusBadgeText(course.status)}
                        </Badge>
                      </div>

                      {/* Certificate Badge */}
                      {course.certificateIssued && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
                            <Award className="h-3 w-3 mr-1" />
                            Certified
                          </Badge>
                        </div>
                      )}

                      {/* Score Badge */}
                      {course.overallScore && (
                        <div className="absolute bottom-4 left-4">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
                            Score: {course.overallScore}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Course Details */}
                    <div className="flex-1 p-6 lg:p-8">
                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Enrolled on{" "}
                                {new Date(course.enrolledAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                              {course.completedAt && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <Clock className="h-4 w-4 text-emerald-400" />
                                  <span className="text-sm text-emerald-600">
                                    Completed{" "}
                                    {new Date(
                                      course.completedAt
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">
                              {course.courseTitle}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {getCompletionStatus(course)}
                            </p>
                            {course.lastAccessedAt && (
                              <p className="text-gray-600 text-sm">
                                Last accessed:{" "}
                                {new Date(
                                  course.lastAccessedAt
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            )}
                          </div>

                          {/* Progress Section */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-900">
                                Learning Progress
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-gray-900">
                                  {course.progress}%
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    refreshProgress(course.courseId, course.id)
                                  }
                                  disabled={refreshing === course.courseId}
                                  className="h-6 w-6 p-0"
                                >
                                  {refreshing === course.courseId ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                                  ) : (
                                    <svg
                                      className="h-3 w-3 text-gray-500"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                      />
                                    </svg>
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Progress
                                value={course.progress}
                                className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden"
                              />
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">0%</span>
                                <span className="text-gray-500">100%</span>
                              </div>
                            </div>

                            {/* Detailed Progress */}
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm text-gray-700">
                                  {course.completedLessons}/
                                  {course.totalLessons} lessons
                                </span>
                              </div>
                              {course.totalAssessments > 0 && (
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm text-gray-700">
                                    {course.completedAssessments}/
                                    {course.totalAssessments} assessments
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex pt-2 gap-4">
                            {/* Start / Continue Button */}
                            <div>
                              <Button
                                size="sm"
                                className="group bg-gradient-to-r from-green-600 to-emerald-700 
      hover:from-green-700 hover:to-emerald-800 text-white shadow-md 
      hover:shadow-lg px-6 py-2 text-[15px]"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/user/courses/${course.courseId}/learn`
                                  )
                                }
                              >
                                {course.progress === 0 ? (
                                  <>
                                    <PlayCircle className="h-5 w-5 mr-2" />
                                    Start
                                  </>
                                ) : course.status === "COMPLETED" ? (
                                  <>
                                    <Award className="h-5 w-5 mr-2" />
                                    Review
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                                    Continue
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Details Button */}
                            <div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 
      text-gray-700 hover:text-emerald-700 px-10 py-2 text-[15px]"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/user/courses/${course.courseId}`
                                  )
                                }
                              >
                                Details
                              </Button>
                            </div>
                            <div>
                              <Button
                                variant="ghost"
                                className="w-full justify-start border border-green-700 text-gray-600 hover:text-green-700 hover:bg-emerald-50 px-10"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/user/courses/${course.courseId}/syllabus`
                                  )
                                }
                              >
                                Syllabus
                              </Button>
                            </div>

                            {/* Certificate Button */}
                            {course.certificateEligible &&
                              !course.certificateIssued && (
                                <div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-amber-300 text-amber-700 hover:bg-amber-50 px-6"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/user/courses/${course.courseId}/certificate`
                                      )
                                    }
                                  >
                                    <Award className="h-4 w-4 mr-2" />
                                    Get Certificate
                                  </Button>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
