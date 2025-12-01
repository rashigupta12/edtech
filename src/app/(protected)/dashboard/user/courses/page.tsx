// src/app/dashboard/user/courses/page.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/auth';
import { BookOpen, Clock, PlayCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CourseEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'EXPIRED';
  progress: number;
  enrolledAt: string;
  lastAccessedAt: string | null;
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
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);

        // Fetch enrollments
        const res1 = await fetch(`/api/enrollments?userId=${userId}`);
        const data1 = await res1.json();
        const enrollmentsData = data1.data || [];
        
        // For each enrollment, fetch the actual progress
        const enrollmentsWithProgress = await Promise.all(
          enrollmentsData.map(async (enrollment: CourseEnrollment) => {
            try {
              // Fetch progress from the progress API
              const progressRes = await fetch(
                `/api/progress?userId=${userId}&courseId=${enrollment.courseId}`
              );
              if (progressRes.ok) {
                const progressData = await progressRes.json();
                return {
                  ...enrollment,
                  progress: progressData.data?.progressPercentage || enrollment.progress
                };
              }
              return enrollment;
            } catch (error) {
              console.error('Error fetching progress:', error);
              return enrollment;
            }
          })
        );
        
        setEnrollments(enrollmentsWithProgress);

        // Fetch stats
        const res2 = await fetch(`/api/enrollments?stats=true&userId=${userId}`);
        const data2 = await res2.json();
        setStats(data2.data || { total: 0, active: 0, completed: 0 });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  // Function to manually calculate progress if needed
  const calculateProgress = async (courseId: string) => {
    try {
      const response = await fetch(`/api/progress?userId=${userId}&courseId=${courseId}`);
      if (response.ok) {
        const data = await response.json();
        return data.data?.progressPercentage || 0;
      }
    } catch (error) {
      console.error('Error calculating progress:', error);
    }
    return 0;
  };

  // Refresh progress for a specific course
  const refreshProgress = async (courseId: string) => {
    const progress = await calculateProgress(courseId);
    setEnrollments(prev => prev.map(enrollment => 
      enrollment.courseId === courseId 
        ? { ...enrollment, progress }
        : enrollment
    ));
  };

  // Show skeleton while loading
  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="space-y-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground mt-2">Continue learning where you left off</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold mt-2">{stats.active}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2">{stats.completed}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Your Courses</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                // Refresh all progress
                const updatedEnrollments = await Promise.all(
                  enrollments.map(async enrollment => {
                    const progress = await calculateProgress(enrollment.courseId);
                    return { ...enrollment, progress };
                  })
                );
                setEnrollments(updatedEnrollments);
              }}
            >
              Refresh Progress
            </Button>
            <Button variant="outline" asChild>
              <Link href="/courses">Browse All Courses</Link>
            </Button>
          </div>
        </div>

        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-6">Start your learning journey today!</p>
              <Button asChild>
                <Link href="/courses">Explore Courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {enrollments.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-64 bg-muted flex items-center justify-center p-8 min-h-[200px]">
                    {course.courseThumbnail ? (
                      <img 
                        src={course.courseThumbnail} 
                        alt={course.courseTitle} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-20 w-20 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Badge 
                            variant={
                              course.status === 'COMPLETED' ? 'default' :
                              course.status === 'ACTIVE' ? 'secondary' :
                              course.status === 'DROPPED' ? 'destructive' :
                              'outline'
                            }
                          >
                            {course.status.toLowerCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Enrolled {new Date(course.enrolledAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold">{course.courseTitle}</h3>
                        {course.lastAccessedAt && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Last accessed: {new Date(course.lastAccessedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => router.push(`/dashboard/user/courses/${course.courseId}/learn`)}
                        >
                          {course.progress === 0 ? 'Start' : 'Continue'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refreshProgress(course.courseId)}
                        >
                          Update Progress
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/user/courses/${course.courseId}`)}>
                        Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/user/courses/${course.courseId}/syllabus`)}>
                        Syllabus
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/user/courses/${course.courseId}/announcements`)}>
                        Announcements
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}