// src/app/dashboard/user/courses/[courseId]/page.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/auth';
import { Award, BookOpen, Calendar, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CourseData {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  level: string;
  language: string;
  categoryName: string;
  collegeName: string;
  price: number;
  isFree: boolean;
  outcomes: Array<{ id: string; outcome: string }>;
  requirements: Array<{ id: string; requirement: string }>;
  curriculum: {
    totalModules: number;
    totalLessons: number;
  };
}

interface EnrollmentData {
  id: string;
  progress: number;
  status: string;
  enrolledAt: string;
}

export default function CourseDetailPage() {
  const user = useCurrentUser();
  const { courseId } = useParams();
  const userId = user?.id;
  const router = useRouter();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!courseId) return;

      try {
        setLoading(true);

        // Fetch course details
        const courseRes = await fetch(`/api/courses?id=${courseId}`);
        const courseJson = await courseRes.json();
        setCourse(courseJson.data || null);

        // Fetch enrollment (if user is logged in)
        if (userId) {
          const enrollRes = await fetch(`/api/enrollments?userId=${userId}&courseId=${courseId}`);
          if (enrollRes.ok) {
            const enrollJson = await enrollRes.json();
            setEnrollment(enrollJson.data?.[0] || null);
          }
        }
      } catch (err) {
        console.error('Failed to load course data', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [courseId, userId]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8 p-6 min-h-screen">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Course not found
  if (!course) {
    return (
      <div className="text-center py-20  min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-emerald-900">Course not found</h1>
        <Button 
          onClick={() => router.push('/dashboard/user/courses')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Back to My Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">{course.title}</h1>
          <p className="text-emerald-700 mt-2 text-lg">{course.shortDescription}</p>
        </div>

        {enrollment && (
          <Button
            size="lg"
            onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Continue Learning
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-700">Progress</p>
                <p className="text-2xl font-bold text-emerald-900">{enrollment?.progress || 0}%</p>
              </div>
            </div>
            <Progress value={enrollment?.progress || 0} className="mt-3 bg-emerald-100" />
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm text-emerald-700">Duration</p>
                <p className="text-2xl font-bold text-emerald-900">{course.duration}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Award className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm text-emerald-700">Level</p>
                <p className="text-2xl font-bold text-emerald-900">{course.level}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <BookOpen className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-sm text-emerald-700">Modules</p>
                <p className="text-2xl font-bold text-emerald-900">{course.curriculum?.totalModules || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left: Description + Outcomes */}
        <div className="md:col-span-2 space-y-8">
          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader className="bg-emerald-50 border-b border-emerald-200">
              <CardTitle className="text-emerald-900">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                className="prose prose-sm max-w-none prose-headings:text-emerald-900 prose-p:text-emerald-800 prose-strong:text-emerald-900"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            </CardContent>
          </Card>

          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader className="bg-emerald-50 border-b border-emerald-200">
              <CardTitle className="text-emerald-900">What You&apos;ll Learn</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {course.outcomes.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-emerald-800">{item.outcome}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader className="bg-emerald-50 border-b border-emerald-200">
              <CardTitle className="text-emerald-900">Course Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm pt-6">
              {/* <div className="flex justify-between">
                <span className="text-emerald-700">Institution</span>
                <span className="font-medium text-emerald-900">{course.collegeName}</span>
              </div> */}
              {/* <Separator className="bg-emerald-200" /> */}
              <div className="flex justify-between">
                <span className="text-emerald-700">Category</span>
                <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-emerald-50">
                  {course.categoryName}
                </Badge>
              </div>
              <Separator className="bg-emerald-200" />
              <div className="flex justify-between">
                <span className="text-emerald-700">Language</span>
                <span className="text-emerald-900">{course.language}</span>
              </div>
              <Separator className="bg-emerald-200" />
              <div className="flex justify-between">
                <span className="text-emerald-700">Status</span>
                <Badge 
                  variant={enrollment ? 'default' : 'secondary'}
                  className={enrollment ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}
                >
                  {enrollment ? 'Enrolled' : 'Not Enrolled'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {course.requirements.length > 0 && (
            <Card className="bg-white border-emerald-200 shadow-sm">
              <CardHeader className="bg-emerald-50 border-b border-emerald-200">
                <CardTitle className="text-emerald-900">Requirements</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm text-emerald-800">
                  {course.requirements.map((req) => (
                    <li key={req.id}>• {req.requirement}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader className="bg-emerald-50 border-b border-emerald-200">
              <CardTitle className="text-emerald-900">Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900 hover:text-emerald-900" 
                asChild
              >
                <Link href={`/dashboard/user/courses/${courseId}/learn`}>
                  <PlayCircle className="mr-2 h-4 w-4 text-emerald-600" />
                  Start / Continue Learning
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900 hover:text-emerald-900" 
                asChild
              >
                <Link href={`/dashboard/user/courses/${courseId}/syllabus`}>
                  <BookOpen className="mr-2 h-4 w-4 text-emerald-600" />
                  View Syllabus
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900 hover:text-emerald-900" 
                asChild
              >
                <Link href={`/dashboard/user/courses/${courseId}/announcements`}>
                  <Calendar className="mr-2 h-4 w-4 text-emerald-600" />
                  Announcements
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}