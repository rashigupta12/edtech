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
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

type CourseStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED"
  | "ARCHIVED";

interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string | null;
  status: CourseStatus;
  currentEnrollments: number;
  isFree: boolean;
  price: number | null;
  discountPrice: number | null;
  isFeatured?: boolean;
  level?: string;
  duration?: string;
  language?: string;
}

interface CourseCategory {
  type: "REGISTRATION_OPEN" | "ONGOING" | "UPCOMING";
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  courses: Course[];
}

export function CoursesCatalog() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id as string | undefined;
  const userRole = session?.user?.role as string | undefined;

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollRefs = {
    REGISTRATION_OPEN: useRef<HTMLDivElement>(null),
    ONGOING: useRef<HTMLDivElement>(null),
    UPCOMING: useRef<HTMLDivElement>(null),
  };

  const isAdminOrJyotishi = userRole === "ADMIN" || userRole === "JYOTISHI";

  // Determine which courses should be visible
  const getVisibleCourses = (allCourses: Course[]): Course[] => {
    if (isAdminOrJyotishi) {
      // Show everything except archived/rejected (useful during development)
      return allCourses.filter(c => !["ARCHIVED", "REJECTED"].includes(c.status));
    }
    // Public users: only fully published courses
    return allCourses.filter(c => c.status === "PUBLISHED");
  };

  // Map status → section
  const getCategoryFromStatus = (status: CourseStatus): keyof typeof scrollRefs | null => {
    if (isAdminOrJyotishi) {
      switch (status) {
        case "PUBLISHED":
          return "REGISTRATION_OPEN";
        case "APPROVED":
          return "ONGOING";
        case "DRAFT":
        case "PENDING_APPROVAL":
          return "UPCOMING";
        default:
          return null;
      }
    }

    // Public view
    switch (status) {
      case "PUBLISHED":
        return "REGISTRATION_OPEN";
      case "APPROVED":
        return "ONGOING";
      default:
        return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const coursesRes = await fetch("/api/courses");
        if (!coursesRes.ok) throw new Error("Failed to fetch courses");

        const result = await coursesRes.json();
        if (!result.success) throw new Error(result.error?.message || "Unknown error");

        const allCourses: Course[] = result.data || [];
        const visibleCourses = getVisibleCourses(allCourses);

        if (!mounted) return;
        setCourses(visibleCourses);

        // Load enrollments if logged in
        if (userId) {
          const enrollRes = await fetch("/api/user/enrollments");
          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            const enrolled = new Set<string>(
              (enrollData.enrollments || [])
                .filter((e: any) => ["ACTIVE", "COMPLETED"].includes(e.status))
                .map((e: any) => e.courseId as string)
            );
            setEnrolledCourseIds(enrolled);
          }
        }
      } catch (err: any) {
        if (mounted) {
          console.error("Catalog error:", err);
          setError(err.message || "Failed to load courses");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (status !== "loading") loadData();

    return () => { mounted = false; };
  }, [userId, status, isAdminOrJyotishi]);

  const courseCategories: CourseCategory[] = useMemo(() => {
    const grouped = {
      REGISTRATION_OPEN: [] as Course[],
      ONGOING: [] as Course[],
      UPCOMING: [] as Course[],
    };

    courses.forEach((course) => {
      const category = getCategoryFromStatus(course.status);
      if (category) grouped[category].push(course);
    });

    return [
      {
        type: "REGISTRATION_OPEN",
        title: "Enrolling Now",
        description: "Open for registration",
        icon: <TrendingUp className="h-4 w-4" />,
        gradient: "from-blue-600 to-blue-800",
        courses: grouped.REGISTRATION_OPEN,
      },
      {
        type: "ONGOING",
        title: "In Progress",
        description: "Currently running",
        icon: <BookOpen className="h-4 w-4" />,
        gradient: "from-blue-700 to-indigo-800",
        courses: grouped.ONGOING,
      },
      {
        type: "UPCOMING",
        title: "Coming Soon",
        description: "Launching soon",
        icon: <Clock className="h-4 w-4" />,
        gradient: "from-amber-600 to-amber-800",
        courses: grouped.UPCOMING,
      },
    ];
  }, [courses]);

  const getPlainText = useCallback((html?: string) => {
    if (!html) return "No description available";
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || div.innerText || "").trim();
  }, []);

  const scroll = useCallback((direction: "left" | "right", category: keyof typeof scrollRefs) => {
    const container = scrollRefs[category].current;
    if (!container) return;
    const scrollAmount = 296;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  const getPriceDisplay = (course: Course) => {
    if (course.isFree) {
      return { display: "Free", original: null, hasDiscount: false };
    }
    const original = course.price ?? 0;
    const discounted = course.discountPrice ?? original;
    const hasDiscount = original > discounted;

    return {
      display: discounted,
      original: hasDiscount ? original : null,
      hasDiscount,
      saveAmount: original - discounted,
    };
  };

  // Loading / Error / Empty States
  if (status === "loading" || loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-100 inline-block">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-lg font-semibold">Loading Courses...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Unable to Load Courses</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const totalVisible = courseCategories.reduce((sum, cat) => sum + cat.courses.length, 0);
  if (totalVisible === 0) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-blue-100 max-w-2xl mx-auto">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-3">
              {isAdminOrJyotishi
                ? "No Published Courses Yet"
                : "No Courses Available Yet"}
            </h3>
            <p className="text-gray-600">
              {isAdminOrJyotishi
                ? "Create and publish your first course to see it here!"
                : "Check back soon — exciting courses are coming!"}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-100/25 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-amber-700 bg-clip-text text-transparent">
            Our Courses
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Learn from expert practitioners with structured, high-quality content
          </p>
        </div>

        {courseCategories.map((category) => {
          if (category.courses.length === 0) return null;
          const showArrows = category.courses.length > 3;

          return (
            <div key={category.type} className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${category.gradient} text-white`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{category.title}</h3>
                    <p className="text-gray-600">{category.description}</p>
                  </div>
                </div>

                {showArrows && (
                  <div className="hidden md:flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => scroll("left", category.type)}>
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => scroll("right", category.type)}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>

              <div
                ref={scrollRefs[category.type]}
                className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {category.courses.map((course) => {
                  const isEnrolled = userId ? enrolledCourseIds.has(course.id) : false;
                  const price = getPriceDisplay(course);

                  return (
                    <Card
                      key={course.id}
                      className="w-80 flex-shrink-0 snap-start bg-white border border-gray-200 shadow-md hover:shadow-xl transition-all duration-300 group"
                    >
                      <CardHeader>
                        <CardTitle className="line-clamp-2 text-lg group-hover:text-blue-700 transition-colors">
                          {course.title}
                        </CardTitle>
                        {course.level && (
                          <p className="text-xs text-gray-500 mt-1">{course.level} Level</p>
                        )}
                      </CardHeader>

                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                          {getPlainText(course.shortDescription || course.description)}
                        </p>

                        {price.hasDiscount && (
                          <div className="mb-3 inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                            <Sparkles className="h-3 w-3" />
                            Save ₹{(price.saveAmount ?? 0).toLocaleString("en-IN")}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <Users className="h-4 w-4" />
                            <span>{course.currentEnrollments} enrolled</span>
                          </div>

                          <div className="text-right">
                            {course.isFree ? (
                              <span className="text-xl font-bold text-green-600">Free</span>
                            ) : (
                              <div>
                                <span className="text-xl font-bold">
                                  ₹{price.display.toLocaleString("en-IN")}
                                </span>
                                {price.original && (
                                  <span className="block text-sm text-gray-500 line-through">
                                    ₹{price.original.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="flex gap-3">
                        <Button asChild variant="outline" className="flex-1">
                          <Link href={`/courses/${course.slug}`}>
                            View Details
                          </Link>
                        </Button>

                        {isEnrolled ? (
                          <Button disabled className="flex-1 bg-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Enrolled
                          </Button>
                        ) : isAdminOrJyotishi ? (
                          <Button disabled variant="secondary" className="flex-1">
                            <Crown className="h-4 w-4 mr-1" />
                            Staff
                          </Button>
                        ) : (
                          <Button asChild className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                            <Link
                              href={
                                userId
                                  ? `/courses/${course.slug}?enroll=true`
                                  : `/auth/login?callbackUrl=/courses/${course.slug}?enroll=true`
                              }
                            >
                              {course.isFree ? "Enroll Free" : "Enroll Now"}
                            </Link>
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}