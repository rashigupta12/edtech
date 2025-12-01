/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CheckoutSidebar } from "@/components/checkout/CheckoutSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Crown,
  Loader2,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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
}

export default function CoursePage() {
  const params = useParams();
  const slug = params.course as string;
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const autoOpenCheckout = searchParams.get("enroll") === "true";
  const [showCheckout, setShowCheckout] = useState(autoOpenCheckout);
  const isAdminOrJyotishi = userRole === "ADMIN" || userRole === "COLLEGE";

  // Fetch course by slug
  useEffect(() => {
    async function loadCourse() {
      if (!slug) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/courses?slug=${slug}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();

        if (!json.success || !json.data || json.data.length === 0) {
          throw new Error("Course not found");
        }

        const courseData: Course = json.data;
        setCourse(courseData);

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
              <Card className="border-green-200 bg-green-50">
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
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Crown className="w-5 h-5" />
                    Staff Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-amber-600 hover:bg-amber-700">
                    <Link href="/dashboard/admin/courses">Manage Course</Link>
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