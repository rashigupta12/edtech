/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Crown,
  Loader2,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { useEffect, useState, useCallback, useMemo } from "react";

interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  status:
    | "REGISTRATION_OPEN"
    | "COMPLETED"
    | "DRAFT"
    | "UPCOMING"
    | "ONGOING"
    | "ARCHIVED";
  priceINR: number;
  priceUSD: number;
  currentEnrollments: number;
}

interface AppliedCoupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: string;
  discountAmount: number;
  creatorType: "ADMIN" | "JYOTISHI";
  creatorName?: string;
  isPersonal: boolean;
}

interface CoursePriceData {
  originalPrice: string;
  finalPrice: string;
  discountAmount: string;
  adminDiscountAmount?: string;
  jyotishiDiscountAmount?: string;
  priceAfterAdminDiscount?: string;
  appliedCoupons?: AppliedCoupon[];
  hasAssignedCoupon: boolean;
}

interface CourseCategory {
  type: "UPCOMING" | "REGISTRATION_OPEN" | "ONGOING";
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  badgeColor: string;
  courses: Course[];
}

// Cache for course prices to avoid refetching
const priceCache = new Map<string, CoursePriceData>();

export function CoursesCatalog() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id as string | undefined;
  const userRole = session?.user?.role as string | undefined;

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(
    new Set()
  );
  const [coursePrices, setCoursePrices] = useState<
    Record<string, CoursePriceData>
  >({});
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Fetch discount details in background after courses are loaded
  const fetchDiscountDetails = useCallback(async (courses: Course[]) => {
    const priceMap: Record<string, CoursePriceData> = {};
    
    // Process in smaller batches to avoid overwhelming the API
    const batchSize = 3;
    
    for (let i = 0; i < courses.length; i += batchSize) {
      const batch = courses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (course) => {
        // Check cache first
        const cacheKey = `${course.slug}-${userId || 'anonymous'}`;
        if (priceCache.has(cacheKey)) {
          return {
            courseId: course.id,
            priceData: priceCache.get(cacheKey)!
          };
        }

        try {
          const res = await fetch(`/api/courses/${course.slug}`);
          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await res.json();
              const priceData = data.course;
              
              // Cache the result
              priceCache.set(cacheKey, priceData);
              
              return {
                courseId: course.id,
                priceData
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${course.slug}:`, error);
        }
        
        return null;
      });

      const results = await Promise.allSettled(batchPromises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          priceMap[result.value.courseId] = result.value.priceData;
        }
      });

      // Small delay between batches to avoid overwhelming the server
      if (i + batchSize < courses.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return priceMap;
  }, [userId]);

  useEffect(() => {
    let mounted = true;

    async function fetchCourses() {
      try {
        setLoading(true);
        setError(null);

        // Fetch courses first
        const coursesRes = await fetch("/api/courses");
        if (!coursesRes.ok) {
          throw new Error(`Failed to fetch courses: ${coursesRes.status}`);
        }

        const contentType = coursesRes.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response format from server");
        }

        const data = await coursesRes.json();
        const rawCourses = data.courses || [];
        const filteredCourses = rawCourses.filter((course: Course) =>
          ["UPCOMING", "REGISTRATION_OPEN", "ONGOING"].includes(course.status)
        );

        if (!mounted) return;

        setCourses(filteredCourses);
        setLoading(false);

        // Fetch enrollments in parallel with discount details
        const [enrollmentsData] = await Promise.allSettled([
          // Fetch enrollments if user is logged in
          userId ? fetch(`/api/user/enrollments`).then(res => res.ok ? res.json() : null) : Promise.resolve(null),
          // Start background loading of discount details
          (async () => {
            setBackgroundLoading(true);
            try {
              const prices = await fetchDiscountDetails(filteredCourses);
              if (mounted) {
                setCoursePrices(prices);
              }
            } finally {
              if (mounted) {
                setBackgroundLoading(false);
              }
            }
          })()
        ]);

        if (!mounted) return;

        // Handle enrollments
        if (userId && enrollmentsData.status === 'fulfilled' && enrollmentsData.value?.enrollments) {
          const enrolledIds = new Set<string>(
            enrollmentsData.value.enrollments
              .filter((e: any) => e.status === "ACTIVE" || e.status === "COMPLETED")
              .map((e: any) => e.courseId as string)
          );
          setEnrolledCourseIds(enrolledIds);
        }

      } catch (err) {
        if (mounted) {
          console.error("Catalog load error:", err);
          setError(err instanceof Error ? err.message : "Failed to load courses");
          setLoading(false);
          setBackgroundLoading(false);
        }
      }
    }

    if (status !== "loading") {
      fetchCourses();
    }

    return () => {
      mounted = false;
    };
  }, [userId, status, fetchDiscountDetails]);

  const isAdminOrJyotishi = userRole === "ADMIN" || userRole === "JYOTISHI";

  const courseCategories: CourseCategory[] = useMemo(() => [
    {
      type: "REGISTRATION_OPEN",
      title: "Enrolling Now",
      description: "Courses currently open for registration",
      icon: <TrendingUp className="h-4 w-4" />,
      gradient: "from-blue-600 to-blue-800",
      badgeColor: "bg-gradient-to-r from-blue-500 to-blue-600",
      courses: courses.filter(
        (course) => course.status === "REGISTRATION_OPEN"
      ),
    },
    {
      type: "ONGOING",
      title: "In Progress",
      description: "Courses currently running",
      icon: <BookOpen className="h-4 w-4" />,
      gradient: "from-blue-700 to-indigo-800",
      badgeColor: "bg-gradient-to-r from-blue-600 to-indigo-600",
      courses: courses.filter((course) => course.status === "ONGOING"),
    },
    {
      type: "UPCOMING",
      title: "Coming Soon",
      description: "Courses starting soon",
      icon: <Clock className="h-4 w-4" />,
      gradient: "from-amber-600 to-amber-800",
      badgeColor: "bg-gradient-to-r from-amber-500 to-amber-600",
      courses: courses.filter((course) => course.status === "UPCOMING"),
    },
  ], [courses]);

  const getPlainText = useCallback((html: string) => {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }, []);

  const getDisplayPrice = useCallback((course: Course) => {
    const priceData = coursePrices[course.id];

    // Check if we have discount data for this course
    if (priceData) {
      // Check if there are any applied coupons OR if there's a discount amount
      const hasAnyCoupons = priceData.appliedCoupons && priceData.appliedCoupons.length > 0;
      const hasDiscountAmount = priceData.discountAmount && parseFloat(priceData.discountAmount) > 0;
      const hasAdminDiscount = priceData.adminDiscountAmount && parseFloat(priceData.adminDiscountAmount) > 0;
      const hasJyotishiDiscount = priceData.jyotishiDiscountAmount && parseFloat(priceData.jyotishiDiscountAmount) > 0;
      
      // Show discount if ANY discount exists (coupons, admin discount, jyotishi discount, or overall discount)
      const hasAnyDiscount = hasAnyCoupons || hasDiscountAmount || hasAdminDiscount || hasJyotishiDiscount;
      
      if (hasAnyDiscount) {
        const originalPrice = parseFloat(priceData.originalPrice);
        const finalPrice = parseFloat(priceData.finalPrice);
        const discountAmount = parseFloat(priceData.discountAmount);

        return {
          displayPrice: finalPrice,
          originalPrice: originalPrice,
          hasDiscount: finalPrice < originalPrice,
          discountAmount: discountAmount,
          appliedCoupons: priceData.appliedCoupons,
          hasAssignedCoupon: priceData.hasAssignedCoupon,
          hasAnyDiscount: true,
          isLoading: false,
        };
      }
    }

    // Return base price (no discount data loaded yet or no discounts available)
    return {
      displayPrice: course.priceINR,
      originalPrice: course.priceINR,
      hasDiscount: false,
      discountAmount: 0,
      appliedCoupons: undefined,
      hasAssignedCoupon: false,
      hasAnyDiscount: false,
      isLoading: !priceData, // Still loading if no price data available
    };
  }, [coursePrices]);

  // Get current active courses based on selected category
  const getActiveCourses = () => {
    if (activeCategory === "ALL") {
      return courses;
    }
    return courseCategories.find(cat => cat.type === activeCategory)?.courses || [];
  };

  const activeCourses = getActiveCourses();

  // Show loading state only for initial load
  if (status === "loading" || loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-100">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-2">
              Loading Courses
            </p>
            <p className="text-sm text-gray-600">
              Discovering amazing learning opportunities
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white rounded-2xl border border-blue-100 p-8 shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Unable to Load Courses
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-700 hover:to-amber-700 text-white px-6 py-3 h-auto font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const totalCourses = courseCategories.reduce(
    (sum, category) => sum + category.courses.length,
    0
  );

  if (totalCourses === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white rounded-2xl border border-blue-100 p-8 shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No Courses Available Yet
            </h3>
            <p className="text-gray-600 mb-2">
              Check back soon for new courses!
            </p>
            <p className="text-sm text-gray-500">
              We&apos;re preparing something amazing for you.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-72 h-72 bg-amber-200 rounded-full blur-3xl opacity-20 animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>

      {/* Background Loading Indicator */}
      {backgroundLoading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-blue-200 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
            <span className="text-xs text-gray-600 font-medium">
              Loading discounts...
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-amber-700 bg-clip-text text-transparent mb-4">
            Featured Courses
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Master ancient sciences with our comprehensive curriculum designed
            by expert practitioners
          </p>
        </div>

        {/* Category Filter - Mobile */}
        <div className="md:hidden mb-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              onClick={() => setActiveCategory("ALL")}
              className={`flex-shrink-0 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeCategory === "ALL"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              All Courses
            </button>
            {courseCategories.map((category) => (
              <button
                key={category.type}
                onClick={() => setActiveCategory(category.type)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-1 ${
                  activeCategory === category.type
                    ? `bg-gradient-to-r ${category.gradient} text-white shadow-md`
                    : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                }`}
              >
                <div className="h-4 w-4 flex items-center justify-center">
                  {category.icon}
                </div>
                <span className="truncate">{category.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter - Desktop */}
        <div className="hidden md:flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
              activeCategory === "ALL"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-gray-50"
            }`}
          >
            All Courses
          </button>
          {courseCategories.map((category) => (
            <button
              key={category.type}
              onClick={() => setActiveCategory(category.type)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                activeCategory === category.type
                  ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg`
                  : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              {category.icon}
              {category.title}
            </button>
          ))}
        </div>

        {/* Courses Display */}
        {activeCategory === "ALL" ? (
          // Show all courses organized by category
          <div className="space-y-12">
            {courseCategories.map((category) => {
              if (category.courses.length === 0) return null;

              return (
                <div key={category.type} className="space-y-6">
                  {/* Category Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl bg-gradient-to-r ${category.gradient} text-white shadow-md`}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {category.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  {/* Courses Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {category.courses.map((course) => renderCourseCard(course))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Show filtered courses for specific category - NOW WITH CONSISTENT STYLING
          <div className="space-y-6">
            {/* Category Header */}
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl bg-gradient-to-r ${
                  courseCategories.find(cat => cat.type === activeCategory)?.gradient || "from-gray-600 to-gray-800"
                } text-white shadow-md`}
              >
                {courseCategories.find(cat => cat.type === activeCategory)?.icon || <TrendingUp className="h-4 w-4" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {courseCategories.find(cat => cat.type === activeCategory)?.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {courseCategories.find(cat => cat.type === activeCategory)?.description}
                </p>
              </div>
            </div>

            {/* Courses Grid - NOW WITH CONSISTENT PADDING AND LAYOUT */}
            {activeCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeCourses.map((course) => renderCourseCard(course))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-blue-100">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  No courses found
                </h4>
                <p className="text-gray-600 mb-4">
                  There are no courses available in this category at the moment.
                </p>
                <Button
                  onClick={() => setActiveCategory("ALL")}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  View All Courses
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );

  function renderCourseCard(course: Course) {
    const isEnrolled = userId
      ? enrolledCourseIds.has(course.id)
      : false;
    const priceInfo = getDisplayPrice(course);

    return (
      <Card
        className="flex flex-col group hover:shadow-lg transition-all duration-300 border border-blue-100 bg-white overflow-hidden relative hover:-translate-y-1 shadow-sm h-full"
      >
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="line-clamp-2 text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
            {course.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 pb-3">
          <CardDescription className="line-clamp-3 text-sm text-gray-600 leading-relaxed mb-4 min-h-[60px]">
            {getPlainText(course.description)}
          </CardDescription>

          {/* Applied Coupons - Show only when discount data is loaded */}
          {priceInfo.hasAnyDiscount && (
            <div className="mb-2">
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                <Sparkles className="h-3 w-3" />
                <span>Discount Applied</span>
              </div>
            </div>
          )}

          {/* Loading state for price */}
          {priceInfo.isLoading && (
            <div className="mb-2">
              <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Checking discounts...</span>
              </div>
            </div>
          )}

          {/* Price Section */}
          <div className="space-y-2 bg-gradient-to-br from-blue-50/50 to-amber-50/30 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span>
                  {course.currentEnrollments} enrolled
                </span>
              </div>
              <div className="text-right">
                {priceInfo.hasDiscount ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-bold text-gray-900 text-base">
                        ₹
                        {priceInfo.displayPrice.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                      <span className="text-xs text-gray-500 line-through">
                        ₹
                        {priceInfo.originalPrice.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-semibold">
                      <Sparkles className="h-2.5 w-2.5" />
                      Save ₹
                      {priceInfo.discountAmount.toLocaleString(
                        "en-IN"
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="font-bold text-gray-900 text-base">
                    ₹
                    {priceInfo.displayPrice.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t border-blue-50 bg-gradient-to-br from-gray-50/30 to-transparent">
          <div className="flex gap-2 w-full">
            <Button
              asChild
              size="sm"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm hover:shadow-md transition-all duration-300 h-9 text-xs font-semibold border-0 rounded-md"
            >
              <Link
                href={`/courses/${course.slug}`}
                className="flex items-center justify-center gap-1"
              >
                View Details
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>

            {isEnrolled ? (
              <Button
                disabled
                size="sm"
                variant="outline"
                className="flex-1 border-green-200 bg-green-50 text-green-700 cursor-not-allowed h-9 text-xs font-semibold rounded-md"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Enrolled
              </Button>
            ) : isAdminOrJyotishi ? (
              <Button
                disabled
                size="sm"
                variant="outline"
                className="flex-1 border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed h-9 text-xs font-semibold rounded-md"
              >
                <Crown className="h-3 w-3 mr-1" />
                Staff
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-sm hover:shadow-md transition-all duration-300 h-9 text-xs font-semibold border-0 rounded-md"
              >
                <Link
                  href={
                    userId
                      ? `/courses/${course.slug}?enroll=true`
                      : `/auth/login?callbackUrl=/courses/${course.slug}?enroll=true`
                  }
                  className="flex items-center justify-center gap-1"
                >
                  Enroll Now
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  }
}