// src/app/(protected)/dashboard/user/layout.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import {
  BookOpen,
  CheckCircle,

  Home,
  IndianRupee,
  Wallet
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

type SingleNavItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  single: true;
};

type NavItem = SingleNavItem;

interface QuickStats {
  enrolledCourses: number;
  activeCourses: number;
  totalSpent: number;
}

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [quickStats, setQuickStats] = useState<QuickStats>({
    enrolledCourses: 0,
    activeCourses: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);

  const userName = session?.user?.name || "Student";
  const userImage = session?.user?.image || "/images/user_alt_icon.png";

  useEffect(() => {
    async function fetchQuickStats() {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/user/learning-summary');
        if (response.ok) {
          const data = await response.json();
          setQuickStats(data);
        } else {
          console.error('Failed to fetch learning summary');
        }
      } catch (error) {
        console.error('Failed to fetch quick stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuickStats();
  }, [session?.user?.id]);

  const getAvatarFallback = () => {
    if (session?.user?.name) {
      return session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "ST";
  };

  const handleLogout = async () => {
    await signOut({ redirectTo: "/auth/login" });
  };

  const isActive = (path: string) => pathname === path;

  const navigationItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard/user",
      single: true,
    },
    {
      title: "My Courses",
      icon: BookOpen,
      href: "/dashboard/user/courses",
      single: true,
    },
    {
      title: "Payments",
      icon: Wallet,
      href: "/dashboard/user/payments",
      single: true,
    },
    // {
    //   title: "Profile",
    //   icon: Settings,
    //   href: "/dashboard/user/profile",
    //   single: true,
    // },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex pt-4">
        {/* Sidebar */}
        <aside className="w-64 pt-6 bg-white border-r min-h-[calc(100vh-64px)] p-4 fixed left-0 top-16 bottom-0 overflow-y-auto">
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <button
                  className={`w-full flex items-center gap-3 rounded-lg p-3 transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-indigo-50 text-indigo-700 font-medium shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm">{item.title}</span>
                </button>
              </Link>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
              Learning Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs text-gray-600">Enrolled Courses</span>
                </div>
                {loading ? (
                  <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-sm font-bold text-indigo-700">
                    {quickStats.enrolledCourses}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-gray-600">Active Now</span>
                </div>
                {loading ? (
                  <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-sm font-bold text-green-600">
                    {quickStats.activeCourses}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-gray-600">Total Spent</span>
                </div>
                {loading ? (
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-sm font-bold text-purple-700">
                    ₹{quickStats.totalSpent.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-64 pt-4 px-6 pb-10">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}