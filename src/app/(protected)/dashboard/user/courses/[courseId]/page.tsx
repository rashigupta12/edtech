// src/app/dashboard/user/courses/[courseId]/page.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/auth';
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  Clock,
  FileText,
  GraduationCap,
  PlayCircle,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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
  hasFinalAssessment: boolean;
  finalAssessmentRequired: boolean;
  minimumCoursePassingScore: number;
  requireAllAssessmentsPassed: boolean;
  outcomes: Array<{ id: string; outcome: string }>;
  requirements: Array<{ id: string; requirement: string }>;
  curriculum: {
    totalModules: number;
    totalLessons: number;
  };
  assessments?: Array<{
    id: string;
    title: string;
    description?: string;
    assessmentLevel: 'LESSON_QUIZ' | 'MODULE_ASSESSMENT' | 'COURSE_FINAL';
    passingScore: number;
    maxAttempts?: number;
    timeLimit?: number;
    isRequired: boolean;
  }>;
}

interface EnrollmentData {
  id: string;
  progress: number;
  status: string;
  enrolledAt: string;
  overallScore: number | null;
  finalAssessmentScore: number | null;
  averageQuizScore: number | null;
  certificateEligible: boolean;
  certificateIssued: boolean;
  completedLessons: number;
  totalLessons: number;
  completedAssessments: number;
  totalAssessments: number;
}

interface AssessmentProgress {
  moduleAssessmentStatus?: Array<{
    moduleTitle: string;
    passed: boolean;
    attempted: boolean;
    latestScore?: number;
    assessmentRequired: boolean;
  }>;
  finalAssessmentStatus?: {
    passed: boolean;
    attempted: boolean;
    latestScore?: number;
    passingScore: number;
    isRequired: boolean;
  };
}

export default function CourseDetailPage() {
  const user = useCurrentUser();
  const { courseId } = useParams() as { courseId: string };
  const userId = user?.id;
  const router = useRouter();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [assessmentProgress, setAssessmentProgress] = useState<AssessmentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

 const fetchAssessmentProgress = useCallback(async () => {
    if (!userId || !courseId) return;
    
    try {
      setStatsLoading(true);
      const progressRes = await fetch(`/api/progress?userId=${userId}&courseId=${courseId}`);
      if (progressRes.ok) {
        const progressJson = await progressRes.json();
        if (progressJson.data) {
          setAssessmentProgress({
            moduleAssessmentStatus: progressJson.data.moduleAssessmentStatus || [],
            finalAssessmentStatus: progressJson.data.finalAssessmentStatus || null
          });
        }
      }
    } catch (err) {
      console.error('Failed to load assessment progress', err);
    } finally {
      setStatsLoading(false);
    }
  }, [userId, courseId]);

  useEffect(() => {
    async function loadData() {
      if (!courseId) return;

      try {
        setLoading(true);

        // Fetch course details with assessments
        const courseRes = await fetch(`/api/courses?id=${courseId}`);
        const courseJson = await courseRes.json();
        setCourse(courseJson.data || null);

        // Fetch enrollment (if user is logged in)
        if (userId) {
          // Get enrollment
          const enrollRes = await fetch(`/api/enrollments?userId=${userId}&courseId=${courseId}`);
          if (enrollRes.ok) {
            const enrollJson = await enrollRes.json();
            setEnrollment(enrollJson.data?.[0] || null);
          }

          // Get detailed progress including assessment status
          await fetchAssessmentProgress();
        }
      } catch (err) {
        console.error('Failed to load course data', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [courseId, userId, fetchAssessmentProgress]);


  // Calculate assessment completion rate
  const calculateAssessmentCompletion = () => {
    if (!assessmentProgress || !course?.assessments) return 0;
    
    const totalRequired = course.assessments.filter(a => a.isRequired).length;
    if (totalRequired === 0) return 100;
    
    let completed = 0;
    
    // Count completed module assessments
    if (assessmentProgress.moduleAssessmentStatus) {
      completed += assessmentProgress.moduleAssessmentStatus
        .filter(m => m.assessmentRequired && m.passed)
        .length;
    }
    
    // Count final assessment if required and passed
    if (assessmentProgress.finalAssessmentStatus) {
      if (assessmentProgress.finalAssessmentStatus.isRequired && 
          assessmentProgress.finalAssessmentStatus.passed) {
        completed++;
      }
    }
    
    return Math.round((completed / totalRequired) * 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8 p-6 min-h-screen max-w-7xl mx-auto">
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
      <div className="text-center py-20 min-h-screen max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Course not found</h1>
        <Button 
          onClick={() => router.push('/dashboard/user/courses')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Back to My Courses
        </Button>
      </div>
    );
  }

  const assessmentCompletion = calculateAssessmentCompletion();
  const hasAssessments = course.assessments && course.assessments.length > 0;
  const hasModuleAssessments = assessmentProgress?.moduleAssessmentStatus && 
    assessmentProgress.moduleAssessmentStatus.length > 0;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="space-y-3">
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent text-gray-600 hover:text-gray-900"
            onClick={() => router.push('/dashboard/user/courses')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-2 text-lg">{course.shortDescription}</p>
          </div>
        </div>

        {enrollment && (
          <Button
            size="lg"
            onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn`)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Continue Learning
          </Button>
        )}
      </div>

      {/* Stats Cards */}
     <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  <Card className="bg-white border border-gray-200 shadow-sm">
    <CardContent className="pt-6">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-green-50 rounded-lg mb-3">
          <BookOpen className="h-6 w-6 text-green-600" />
        </div>
        <p className="text-sm text-gray-600 mb-1">Progress</p>
        <p className="text-2xl font-bold text-gray-900 mb-2">{enrollment?.progress || 0}%</p>
        <p className="text-xs text-gray-500">
          {enrollment?.completedLessons || 0}/{enrollment?.totalLessons || 0} lessons
        </p>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
          <div 
            className="bg-green-600 h-1.5 rounded-full" 
            style={{ width: `${enrollment?.progress || 0}%` }}
          />
        </div>
      </div>
    </CardContent>
  </Card>

  <Card className="bg-white border border-gray-200 shadow-sm">
    <CardContent className="pt-6">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-blue-50 rounded-lg mb-3">
          <Target className="h-6 w-6 text-blue-600" />
        </div>
        <p className="text-sm text-gray-600 mb-1">Assessments</p>
        <p className="text-2xl font-bold text-gray-900 mb-2">{assessmentCompletion}%</p>
        <p className="text-xs text-gray-500">
          {enrollment?.completedAssessments || 0}/{enrollment?.totalAssessments || 0} passed
        </p>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
          <div 
            className="bg-blue-600 h-1.5 rounded-full" 
            style={{ width: `${assessmentCompletion}%` }}
          />
        </div>
      </div>
    </CardContent>
  </Card>

  <Card className="bg-white border border-gray-200 shadow-sm">
    <CardContent className="pt-6">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-amber-50 rounded-lg mb-3">
          <Clock className="h-6 w-6 text-amber-600" />
        </div>
        <p className="text-sm text-gray-600 mb-1">Duration</p>
        <p className="text-2xl font-bold text-gray-900">{course.duration}</p>
      </div>
    </CardContent>
  </Card>

  

  <Card className="bg-white border border-gray-200 shadow-sm">
    <CardContent className="pt-6">
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-indigo-50 rounded-lg mb-3">
          <BarChart3 className="h-6 w-6 text-indigo-600" />
        </div>
        <p className="text-sm text-gray-600 mb-1">Overall Score</p>
        <p className="text-2xl font-bold text-gray-900">
          {enrollment?.overallScore != null ? `${enrollment?.overallScore}%` : 'N/A'}
        </p>
        <div className="flex flex-col gap-1 mt-2 text-xs text-gray-500">
          <span>
            Final: {enrollment?.finalAssessmentScore !== null ? `${enrollment?.finalAssessmentScore}%` : 'N/A'}
          </span>
          <span>
            Avg Quiz: {enrollment?.averageQuizScore !== null ? `${enrollment?.averageQuizScore}%` : 'N/A'}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left: Description + Outcomes + Assessments */}
        <div className="md:col-span-2 space-y-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Course Description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-green-600" />
                Learning Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {course.outcomes.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item.outcome}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Assessment Information */}
          {hasAssessments && (
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Assessment Overview
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchAssessmentProgress}
                    disabled={statsLoading}
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    {statsLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                    ) : (
                      'Refresh'
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Course Completion Requirements */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Course Completion Requirements</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${course.requireAllAssessmentsPassed ? 'text-green-500' : 'text-gray-400'}`} />
                        {course.requireAllAssessmentsPassed ? 'All assessments must be passed' : 'Assessments are optional'}
                      </li>
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        Minimum passing score: {course.minimumCoursePassingScore}%
                      </li>
                      {course.hasFinalAssessment && (
                        <li className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-purple-500" />
                          Final assessment {course.finalAssessmentRequired ? 'required' : 'optional'}
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Module Assessments */}
                  {hasModuleAssessments && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Module Assessments</h4>
                      <div className="space-y-3">
                        {assessmentProgress!.moduleAssessmentStatus!.map((module, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                module.passed ? 'bg-green-100 text-green-700' : 
                                module.attempted ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                <Target className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{module.moduleTitle}</p>
                                <p className="text-xs text-gray-600">
                                  {module.assessmentRequired ? 'Required' : 'Optional'} • 
                                  {module.attempted ? ` Score: ${module.latestScore}%` : ' Not attempted'}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant={module.passed ? 'default' : module.attempted ? 'secondary' : 'outline'}
                              className={`
                                ${module.passed ? 'bg-green-600 hover:bg-green-700 text-white' : 
                                  module.attempted ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 
                                  'border-gray-300 text-gray-700 bg-white'}
                              `}
                            >
                              {module.passed ? 'Passed' : module.attempted ? 'Failed' : 'Pending'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Final Assessment */}
                  {course.hasFinalAssessment && assessmentProgress?.finalAssessmentStatus && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Final Assessment</h4>
                      <div className={`p-4 rounded-lg border ${
                        assessmentProgress.finalAssessmentStatus.passed ? 
                        'bg-green-50 border-green-200' : 
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Award className={`h-8 w-8 ${
                              assessmentProgress.finalAssessmentStatus.passed ? 
                              'text-green-600' : 'text-gray-600'
                            }`} />
                            <div>
                              <p className="font-medium text-gray-900">Course Final Exam</p>
                              <p className="text-sm text-gray-700">
                                Passing score: {assessmentProgress.finalAssessmentStatus.passingScore}%
                                {assessmentProgress.finalAssessmentStatus.attempted && 
                                  ` • Your score: ${assessmentProgress.finalAssessmentStatus.latestScore}%`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={assessmentProgress.finalAssessmentStatus.passed ? 'default' : 
                                      assessmentProgress.finalAssessmentStatus.attempted ? 'secondary' : 'outline'}
                              className={`
                                ${assessmentProgress.finalAssessmentStatus.passed ? 
                                  'bg-green-600 hover:bg-green-700 text-white' : 
                                  assessmentProgress.finalAssessmentStatus.attempted ? 
                                  'bg-amber-100 text-amber-800 hover:bg-amber-200' : 
                                  'border-gray-300 text-gray-700 bg-white'}
                              `}
                            >
                              {assessmentProgress.finalAssessmentStatus.passed ? 'Passed' : 
                               assessmentProgress.finalAssessmentStatus.attempted ? 'Failed' : 
                               assessmentProgress.finalAssessmentStatus.isRequired ? 'Required' : 'Optional'}
                            </Badge>
                            {assessmentProgress.finalAssessmentStatus.attempted && !assessmentProgress.finalAssessmentStatus.passed && (
                              <p className="text-xs text-amber-600 mt-1">
                                Need {assessmentProgress.finalAssessmentStatus.passingScore}% to pass
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assessment Types */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Assessment Types</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-6 w-6 bg-blue-50 rounded flex items-center justify-center">
                            <FileText className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">Lesson Quizzes</span>
                        </div>
                        <p className="text-xs text-gray-600">Test understanding after each lesson</p>
                      </div>
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-6 w-6 bg-purple-50 rounded flex items-center justify-center">
                            <Target className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">Module Tests</span>
                        </div>
                        <p className="text-xs text-gray-600">Comprehensive module assessments</p>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Status */}
                  {enrollment && (
                    <div className={`p-4 rounded-lg border ${
                      enrollment.certificateEligible ? 
                      'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Award className={`h-8 w-8 ${
                            enrollment.certificateIssued ? 'text-green-600' : 
                            enrollment.certificateEligible ? 'text-amber-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">
                              {enrollment.certificateIssued ? 'Certificate Issued' : 
                               enrollment.certificateEligible ? 'Certificate Ready' : 'Certificate Status'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {enrollment.certificateIssued ? 'Download your certificate' : 
                               enrollment.certificateEligible ? 'You are eligible for a certificate' : 
                               'Complete course requirements for certificate'}
                            </p>
                          </div>
                        </div>
                        {enrollment.certificateEligible && !enrollment.certificateIssued && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => router.push(`/dashboard/user/courses/${courseId}/certificate`)}
                          >
                            Get Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Course Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm pt-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  {course.categoryName}
                </Badge>
              </div>
              <Separator className="bg-gray-200" />
              <div className="flex justify-between">
                <span className="text-gray-600">Language</span>
                <span className="text-gray-900">{course.language}</span>
              </div>
              <Separator className="bg-gray-200" />
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <Badge 
                  variant={enrollment ? 'default' : 'secondary'}
                  className={enrollment ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-100 text-gray-800'}
                >
                  {enrollment ? 'Enrolled' : 'Not Enrolled'}
                </Badge>
              </div>
              {enrollment && (
                <>
                  <Separator className="bg-gray-200" />
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enrolled Since</span>
                    <span className="text-gray-900">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {course.requirements.length > 0 && (
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Prerequisites
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm text-gray-700">
                  {course.requirements.map((req) => (
                    <li key={req.id} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {req.requirement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-green-600" />
                Curriculum Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Modules</span>
                </div>
                <span className="font-semibold text-gray-900">{course.curriculum?.totalModules || 0}</span>
              </div>
              <Separator className="bg-gray-200" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Lessons</span>
                </div>
                <span className="font-semibold text-gray-900">{course.curriculum?.totalLessons || 0}</span>
              </div>
              <Separator className="bg-gray-200" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Assessments</span>
                </div>
                <span className="font-semibold text-gray-900">{enrollment?.totalAssessments || 0}</span>
              </div>
              {course.hasFinalAssessment && (
                <>
                  <Separator className="bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600">Final Exam</span>
                    </div>
                    <Badge variant="outline" className="border-gray-300 text-gray-700 bg-white">
                      {course.finalAssessmentRequired ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card> */}

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-green-600" />
                Quick Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 hover:border-gray-400" 
                asChild
              >
                <Link href={`/dashboard/user/courses/${courseId}/learn`}>
                  <PlayCircle className="mr-2 h-4 w-4 text-green-600" />
                  {enrollment?.progress === 0 ? 'Start Learning' : 'Continue Learning'}
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 hover:border-gray-400" 
                asChild
              >
                <Link href={`/dashboard/user/courses/${courseId}/syllabus`}>
                  <BookOpen className="mr-2 h-4 w-4 text-green-600" />
                  View Syllabus
                </Link>
              </Button>
              {/* {hasAssessments && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 hover:border-gray-400" 
                  asChild
                >
                  <Link href={`/dashboard/user/courses/${courseId}/assessments`}>
                    <Target className="mr-2 h-4 w-4 text-blue-600" />
                    View Assessments
                  </Link>
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 hover:border-gray-400" 
                asChild
              >
                <Link href={`/dashboard/user/courses/${courseId}/progress`}>
                  <BarChart3 className="mr-2 h-4 w-4 text-green-600" />
                  Progress Report
                </Link>
              </Button> */}
              {enrollment?.certificateEligible && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 hover:border-gray-400" 
                  asChild
                >
                  <Link href={`/dashboard/user/courses/${courseId}/certificate`}>
                    <Award className="mr-2 h-4 w-4 text-amber-600" />
                    Get Certificate
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}