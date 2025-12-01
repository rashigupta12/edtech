/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { CheckoutSidebar } from "@/components/checkout/CheckoutSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Crown,
  Loader2,
  Shield,
  Star,
  Users,
  PlayCircle,
  FileText,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface LearningOutcome {
  id: string;
  outcome: string;
  sortOrder: number;
}

interface Requirement {
  id: string;
  requirement: string;
  sortOrder: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  videoUrl: string | null;
  videoDuration: number | null;
  articleContent: string | null;
  isFree: boolean;
  sortOrder: number;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  previewVideoUrl?: string | null;
  duration?: string | null;
  level?: string | null;
  language?: string | null;
  prerequisites?: string | null;
  status: string;
  isFeatured?: boolean;
  maxStudents?: number | null;
  currentEnrollments: number;
  isFree: boolean;
  price: number | null;
  discountPrice: number | null;
  createdAt: string;
  publishedAt?: string | null;
  collegeName?: string | null;
  categoryName?: string | null;
  outcomes?: LearningOutcome[];
  requirements?: Requirement[];
}

export default function CoursePage() {
  const params = useParams();
  const slug = params.course as string;
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const autoOpenCheckout = searchParams.get("enroll") === "true";
  const [showCheckout, setShowCheckout] = useState(autoOpenCheckout);
  const isAdminOrJyotishi = userRole === "ADMIN" || userRole === "COLLEGE";

  // Fetch course by slug and then get curriculum
  useEffect(() => {
    async function loadCourse() {
      if (!slug) return;

      try {
        setLoading(true);
        
        // First, fetch course by slug
        const res = await fetch(`/api/courses?slug=${slug}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();

        if (!json.success || !json.data) {
          throw new Error("Course not found");
        }

        const courseData: Course = json.data;
        setCourse(courseData);

        // Then fetch curriculum using the course ID
        const curriculumRes = await fetch(
          `/api/courses?id=${courseData.id}&curriculum=true`,
          { cache: "no-store" }
        );
        
        if (curriculumRes.ok) {
          const curriculumJson = await curriculumRes.json();
          if (curriculumJson.success && curriculumJson.data?.modules) {
            setModules(curriculumJson.data.modules);
          }
        }

        // Check enrollment
        if (userId && !isAdminOrJyotishi) {
          const enrollRes = await fetch("/api/user/enrollments");
          if (enrollRes.ok) {
            const enrollJson = await enrollRes.json();
            const enrolled = enrollJson.enrollments?.some(
              (e: any) => e.courseId === courseData.id && ["ACTIVE", "COMPLETED"].includes(e.status)
            );
            setIsEnrolled(enrolled);
          }
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [slug, userId, isAdminOrJyotishi]);

  // Price logic
  const finalPrice = course?.isFree ? 0 : (course?.discountPrice || course?.price || 0);
  const originalPrice = course?.isFree ? 0 : (course?.price || 0);
  const hasDiscount = originalPrice > finalPrice;

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const totalLessons = modules.reduce((total, module) => total + (module.lessons?.length || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center text-white">
            {course.isFeatured && (
              <Badge className="mb-4 bg-amber-500 text-white">
                <Star className="w-3 h-3 mr-1" /> Featured Course
              </Badge>
            )}

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{course.title}</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              {course.shortDescription || "Master this subject with expert guidance"}
            </p>

            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{course.duration || "Self-paced"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{course.currentEnrollments} students</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                <span>Certificate Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {course.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About This Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-blue max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: course.description }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Learning Outcomes */}
            {course.outcomes && course.outcomes.length > 0 && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-50">
                  <CardTitle>What You&apos;ll Learn</CardTitle>
                  <CardDescription>
                    Key skills and knowledge you&apos;ll gain from this course
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {course.outcomes.map((outcome, index) => (
                      <li key={outcome.id} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{outcome.outcome}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-50">
                  <CardTitle>Requirements</CardTitle>
                  <CardDescription>
                    Prerequisites for taking this course
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {course.requirements.map((requirement) => (
                      <li key={requirement.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                          •
                        </div>
                        <span className="text-gray-700">{requirement.requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Course Curriculum */}
            {modules && modules.length > 0 && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-50">
                  <CardTitle>Course Curriculum</CardTitle>
                  <CardDescription>
                    {modules.length} modules • {totalLessons} lessons
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {modules.map((module, index) => (
                      <div
                        key={module.id}
                        className="border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {/* Module Header */}
                        <div
                          className="flex items-start gap-3 p-4 cursor-pointer"
                          onClick={() => toggleModule(module.id)}
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm mt-1">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{module.title}</h4>
                            {module.description && (
                              <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>{module.lessons?.length || 0} lessons</span>
                            </div>
                          </div>
                          <ChevronDown
                            className={`h-5 w-5 text-gray-400 transition-transform ${
                              expandedModules.includes(module.id) ? "rotate-180" : ""
                            }`}
                          />
                        </div>

                        {/* Lessons Section */}
                        {expandedModules.includes(module.id) && (
                          <div className="border-t bg-gray-50">
                            {!module.lessons || module.lessons.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                No lessons available yet.
                              </div>
                            ) : (
                              <div className="space-y-2 p-4">
                                {module.lessons.map((lesson, lessonIndex) => (
                                  <div
                                    key={lesson.id}
                                    className="flex items-start gap-3 p-3 bg-white rounded-lg border"
                                  >
                                    <div className="flex-shrink-0 mt-1">
                                      {lesson.contentType === "VIDEO" ? (
                                        <PlayCircle className="w-5 h-5 text-blue-600" />
                                      ) : (
                                        <FileText className="w-5 h-5 text-gray-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between">
                                        <h5 className="font-medium text-gray-900 text-sm">
                                          {lesson.title}
                                        </h5>
                                        {lesson.isFree && (
                                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                            Free Preview
                                          </Badge>
                                        )}
                                      </div>
                                      {lesson.description && (
                                        <p className="text-xs text-gray-600 mt-1">
                                          {lesson.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                        {lesson.videoDuration && (
                                          <span>
                                            {Math.floor(lesson.videoDuration / 60)}m{" "}
                                            {lesson.videoDuration % 60}s
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Level & Language */}
            <div className="flex flex-wrap gap-3">
              {course.level && (
                <Badge variant="secondary" className="text-sm">
                  {course.level}
                </Badge>
              )}
              {course.language && (
                <Badge variant="outline">{course.language}</Badge>
              )}
              {course.collegeName && (
                <Badge variant="outline">By {course.collegeName}</Badge>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {isEnrolled ? (
              <Card className="border-green-200 bg-green-50 sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-5 h-5" />
                    You&apos;re Enrolled!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                    <Link href="/dashboard/user/courses">Go to My Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : isAdminOrJyotishi ? (
              <Card className="border-amber-200 bg-amber-50 sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Crown className="w-5 h-5" />
                    Staff Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-amber-600 hover:bg-amber-700">
                    <Link href={`/dashboard/admin/courses/${course.id}`}>Manage Course</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-6 shadow-lg">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-t-xl">
                  <div className="text-white">
                    {course.isFree ? (
                      <div className="text-4xl font-bold">Free</div>
                    ) : hasDiscount ? (
                      <div>
                        <div className="text-2xl line-through opacity-70">
                          ₹{originalPrice.toLocaleString("en-IN")}
                        </div>
                        <div className="text-4xl font-bold">
                          ₹{finalPrice.toLocaleString("en-IN")}
                        </div>
                        <Badge className="mt-2 bg-green-500">
                          Save ₹{(originalPrice - finalPrice).toLocaleString("en-IN")}
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold">
                        ₹{finalPrice.toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                </div>

                <CardContent className="p-6 space-y-4">
                  <Button
                    onClick={() => setShowCheckout(true)}
                    className="w-full h-12 text-lg font-semibold bg-amber-500 hover:bg-amber-600"
                  >
                    {course.isFree ? "Enroll for Free" : "Enroll Now"}
                  </Button>

                  <div className="text-center text-sm text-gray-600 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>30-Day Money-Back Guarantee</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>Lifetime Access</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Sidebar */}
     {!isEnrolled && !isAdminOrJyotishi && course && (
  <CheckoutSidebar
    course={{
      id: course.id,
      title: course.title,
      priceINR: finalPrice.toString(),
      slug: course.slug,
      isFree: course.isFree, // Add this
    }}
    isOpen={showCheckout}
    onClose={() => setShowCheckout(false)}
    appliedCoupons={[]}
    finalPrice={finalPrice.toString()}
    originalPrice={originalPrice.toString()}
    discountAmount={hasDiscount ? (originalPrice - finalPrice).toString() : undefined}
  />
)}
    </div>
  );
}