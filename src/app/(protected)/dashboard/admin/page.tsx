// src/app/(protected)/dashboard/admin/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface DashboardStats {
  totalUsers: {
    count: number;
    growth: number;
    newThisMonth: number;
  };
  activeCourses: {
    count: number;
    total: number;
    newThisMonth: number;
  };
  revenue: {
    total: number;
    growth: number;
    thisMonth: number;
  };
  pendingCertificates: {
    count: number;
  };
  enrollments: {
    total: number;
    active: number;
  };
}

interface Activity {
  id: string;
  action: string;
  time: string;
  type: "enrollment" | "certificate" | "blog" | "payment";
  color: "blue" | "amber" | "indigo" | "emerald";
  metadata?: {
    userName?: string;
    courseName?: string;
    amount?: number;
    blogTitle?: string;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setActivitiesLoading(true);

      // Use Promise.all to fetch both endpoints in parallel
      const [statsResponse, activitiesResponse] = await Promise.all([
        fetch("/api/admin/dashboard-stats"),
        fetch("/api/admin/recent-activity")
      ]);

      // Process stats response immediately
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        console.error("Failed to fetch dashboard stats");
      }

      // Process activities response
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        // Sort activities by timestamp in descending order (latest first)
        const sortedData = activitiesData.sort((a: Activity, b: Activity) => {
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        });
        setActivities(sortedData);
      } else {
        console.error("Failed to fetch recent activity");
      }

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setActivitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "enrollment": return "📝";
      case "certificate": return "🎓";
      case "blog": return "✍️";
      case "payment": return "💳";
      default: return "📌";
    }
  };

  // Show stats immediately when available, don't wait for activities
  const statsLoaded = !loading && stats !== null;

  return (
    <>
      {/* Dashboard Overview */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <Link href="/dashboard/admin/users">
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl shadow-sm">
                👥
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Users</h3>
            {!statsLoaded ? (
              <div className="space-y-2">
                <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stats?.totalUsers.count.toLocaleString()}
                </p>
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${
                    stats && stats.totalUsers.growth >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {stats && stats.totalUsers.growth >= 0 ? "+" : ""}
                    {stats?.totalUsers.growth.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </>
            )}
          </div>
        </Link>

        {/* Active Courses */}
        <Link href="/dashboard/admin/courses">
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-2xl shadow-sm">
                📚
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Active Courses</h3>
            {!statsLoaded ? (
              <div className="space-y-2">
                <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stats?.activeCourses.count}
                </p>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-emerald-600">
                    +{stats?.activeCourses.newThisMonth}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">new this month</span>
                </div>
              </>
            )}
          </div>
        </Link>

        {/* Total Revenue */}
        <Link href="/dashboard/admin/payments">
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-sm">
                💰
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
            {!statsLoaded ? (
              <div className="space-y-2">
                <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(stats?.revenue.total || 0)}
                </p>
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${
                    stats && stats.revenue.growth >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {stats && stats.revenue.growth >= 0 ? "+" : ""}
                    {stats?.revenue.growth.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </>
            )}
          </div>
        </Link>

        {/* Pending Certificates */}
        <Link href="/dashboard/admin/certificates/requests">
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-2xl shadow-sm">
                🏆
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Certificates</h3>
            {!statsLoaded ? (
              <div className="space-y-2">
                <div className="h-9 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stats?.pendingCertificates.count}
                </p>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">
                    Awaiting approval
                  </span>
                </div>
              </>
            )}
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </button>
        </div>
        
        {activitiesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-4 px-4 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between py-4 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      act.color === "blue"
                        ? "bg-blue-100"
                        : act.color === "amber"
                        ? "bg-amber-100"
                        : act.color === "indigo"
                        ? "bg-indigo-100"
                        : "bg-emerald-100"
                    }`}
                  >
                    <span className="text-lg">{getIconForType(act.type)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{act.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{act.time}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                    act.color === "blue"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : act.color === "amber"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : act.color === "indigo"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {act.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}