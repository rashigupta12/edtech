// src/app/(protected)/dashboard/user/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, Trophy } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface DashboardStats {
  enrolledCourses: number;
  newThisMonth: number;
  hoursLearned: number;
  certificates: number;
  certificatesInProgress: number;
  learningStreak: number;
}

interface ActiveCourse {
  id: string;
  title: string;
  slug: string;
  progress: number;
  sessions: number;
  completedSessions: number;
  thumbnail?: string;
}

export default function UserDashboardHome() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeCourses, setActiveCourses] = useState<ActiveCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!session?.user?.id) return;

      try {
        setLoading(true);

        // Fetch dashboard stats
        const statsResponse = await fetch("/api/user/dashboard-stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchActiveCourses() {
      if (!session?.user?.id) return;

      try {
        setCoursesLoading(true);

        // Fetch active courses
        const coursesResponse = await fetch("/api/user/active-courses");
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setActiveCourses(coursesData);
        }
      } catch (error) {
        console.error("Failed to fetch active courses:", error);
      } finally {
        setCoursesLoading(false);
      }
    }

    fetchDashboardData();
    fetchActiveCourses();
  }, [session?.user?.id]);

  const userName = session?.user?.name?.split(" ")[0] || "Student";

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative">
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-yellow-500 rounded-full"></div>
        <div className="pl-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
            Welcome back, {userName}!
          </h1>
          <p className="text-slate-600 mt-1">Continue your learning journey</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Enrolled Courses */}
        <Card className="border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              Enrolled Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-900">
                  {stats?.enrolledCourses || 0}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  +{stats?.newThisMonth || 0} this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Hours Learned */}
        {/* <Card className="border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              Hours Learned
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-900">
                  {stats?.hoursLearned || 0}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Keep learning!
                </p>
              </>
            )}
          </CardContent>
        </Card> */}

        {/* Certificates */}
        <Card className="border border-yellow-100 bg-gradient-to-br from-white to-yellow-50/30 shadow-sm hover:shadow-lg hover:border-yellow-200 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <Trophy className="h-4 w-4 text-yellow-600" />
              </div>
              Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-900">
                  {stats?.certificates || 0}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {stats?.certificatesInProgress || 0} in progress
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Learning Streak */}
        {/* <Card className="border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-yellow-600" />
              </div>
              Learning Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-900">
                  {stats?.learningStreak || 0} days
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  {stats?.learningStreak && stats.learningStreak > 0 ? "Keep it up!" : "Start your streak!"}
                </p>
              </>
            )}
          </CardContent>
        </Card> */}
      </div>

      {/* Active Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-blue-900">
            Continue Learning
          </h2>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Link
              href="/dashboard/user/courses"
              className="flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {coursesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-blue-100 bg-white">
                <CardHeader className="pb-3">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-2.5 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-9 w-full bg-gray-200 rounded animate-pulse mt-4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeCourses.length === 0 ? (
          <Card className="border border-blue-100 bg-white">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Active Courses Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start your learning journey by enrolling in a course
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeCourses.map((course) => (
              <Card
                key={course.id}
                className="border border-blue-100 bg-white hover:shadow-lg hover:border-blue-200 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Golden Top Border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>

                <CardHeader className="pb-3 pt-5">
                  <CardTitle className="text-base font-semibold line-clamp-1 text-blue-900">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="w-full bg-blue-50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 group-hover:from-blue-600 group-hover:to-blue-700"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        {course.completedSessions} of {course.sessions} sessions
                      </p>
                      <p className="text-xs font-semibold text-blue-600">
                        {course.progress}%
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm"
                    size="sm"
                  >
                    <Link href={`/dashboard/user/courses/${course.slug}`}>
                      Continue
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-yellow-50/50 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Ready for your next course?
              </h3>
              <p className="text-slate-600 text-sm mt-1">
                Explore our comprehensive astrological programs
              </p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Link href="/courses" className="flex items-center gap-2">
                Browse Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}