// src/app/dashboard/user/courses/[courseId]/page.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/auth';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Clock, 
  PlayCircle, 
  Target,
  BarChart3,
  FileText,
  Users,
  Star
} from 'lucide-react';
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
  }, [courseId, userId]);

  const fetchAssessmentProgress = async () => {
    if (!userId) return;
    
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
  };

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

  const assessmentCompletion = calculateAssessmentCompletion();
  const hasAssessments = course.assessments && course.assessments.length > 0;
  const hasModuleAssessments = assessmentProgress?.moduleAssessmentStatus && 
    assessmentProgress.moduleAssessmentStatus.length > 0;

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
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-700">Progress</p>
                <p className="text-2xl font-bold text-emerald-900">{enrollment?.progress || 0}%</p>
                <p className="text-xs text-emerald-600 mt-1">
                  {enrollment?.completedLessons || 0}/{enrollment?.totalLessons || 0} lessons
                </p>
              </div>
            </div>
            <Progress value={enrollment?.progress || 0} className="mt-3 bg-emerald-100" />
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700">Assessments</p>
                <p className="text-2xl font-bold text-blue-900">{assessmentCompletion}%</p>
                <p className="text-xs text-blue-600 mt-1">
                  {enrollment?.completedAssessments || 0}/{enrollment?.totalAssessments || 0} passed
                </p>
              </div>
            </div>
            <Progress value={assessmentCompletion} className="mt-3 bg-blue-100" />
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-sm text-amber-700">Duration</p>
                <p className="text-2xl font-bold text-amber-900">{course.duration}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Award className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-700">Level</p>
                <p className="text-2xl font-bold text-purple-900">{course.level}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              <div className="flex-1">
                <p className="text-sm text-indigo-700">Overall Score</p>
                <p className="text-2xl font-bold text-indigo-900">
                  {enrollment?.overallScore != null ? `${enrollment?.overallScore}%` : 'N/A'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="text-indigo-600">
                    Final: {enrollment?.finalAssessmentScore !== null ? `${enrollment?.finalAssessmentScore}%` : 'N/A'}
                  </span>
                  <span className="text-indigo-600">
                    Avg Quiz: {enrollment?.averageQuizScore !== null ? `${enrollment?.averageQuizScore}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left: Description + Outcomes + Assessments */}
        <div className="md:col-span-2 space-y-8">
          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader className="bg-emerald-50 border-b border-emerald-200">
              <CardTitle className="text-emerald-900">Course Description</CardTitle>
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
              <CardTitle className="text-emerald-900">Learning Outcomes</CardTitle>
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

          {/* Assessment Information */}
          {hasAssessments && (
            <Card className="bg-white border-blue-200 shadow-sm">
              <CardHeader className="bg-blue-50 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-blue-900">Assessment Overview</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchAssessmentProgress}
                    disabled={statsLoading}
                    className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                  >
                    {statsLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    ) : (
                      'Refresh'
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Course Completion Requirements */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Course Completion Requirements</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${course.requireAllAssessmentsPassed ? 'text-blue-600' : 'text-gray-400'}`} />
                        {course.requireAllAssessmentsPassed ? 'All assessments must be passed' : 'Assessments are optional'}
                      </li>
                      <li className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Minimum passing score: {course.minimumCoursePassingScore}%
                      </li>
                      {course.hasFinalAssessment && (
                        <li className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-purple-600" />
                          Final assessment {course.finalAssessmentRequired ? 'required' : 'optional'}
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Module Assessments */}
                  {hasModuleAssessments && (
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-3">Module Assessments</h4>
                      <div className="space-y-3">
                        {assessmentProgress!.moduleAssessmentStatus!.map((module, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                module.passed ? 'bg-emerald-100 text-emerald-700' : 
                                module.attempted ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                <Target className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-blue-900">{module.moduleTitle}</p>
                                <p className="text-xs text-blue-600">
                                  {module.assessmentRequired ? 'Required' : 'Optional'} • 
                                  {module.attempted ? ` Score: ${module.latestScore}%` : ' Not attempted'}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant={module.passed ? 'default' : module.attempted ? 'secondary' : 'outline'}
                              className={`
                                ${module.passed ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 
                                  module.attempted ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 
                                  'border-blue-300 text-blue-700'}
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
                      <h4 className="font-semibold text-purple-900 mb-3">Final Assessment</h4>
                      <div className={`p-4 rounded-lg border ${
                        assessmentProgress.finalAssessmentStatus.passed ? 
                        'bg-emerald-50 border-emerald-200' : 
                        'bg-purple-50 border-purple-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Award className={`h-8 w-8 ${
                              assessmentProgress.finalAssessmentStatus.passed ? 
                              'text-emerald-600' : 'text-purple-600'
                            }`} />
                            <div>
                              <p className="font-medium text-purple-900">Course Final Exam</p>
                              <p className="text-sm text-purple-700">
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
                                  'bg-emerald-500 hover:bg-emerald-600 text-white' : 
                                  assessmentProgress.finalAssessmentStatus.attempted ? 
                                  'bg-amber-100 text-amber-800 hover:bg-amber-200' : 
                                  'border-purple-300 text-purple-700'}
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
                    <h4 className="font-semibold text-blue-900 mb-3">Assessment Types</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-blue-100 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-6 w-6 bg-blue-100 rounded flex items-center justify-center">
                            <FileText className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-blue-900">Lesson Quizzes</span>
                        </div>
                        <p className="text-xs text-blue-600">Test understanding after each lesson</p>
                      </div>
                      <div className="p-3 bg-white border border-blue-100 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-6 w-6 bg-purple-100 rounded flex items-center justify-center">
                            <Target className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-purple-900">Module Tests</span>
                        </div>
                        <p className="text-xs text-purple-600">Comprehensive module assessments</p>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Status */}
                  {enrollment && (
                    <div className={`p-4 rounded-lg border ${
                      enrollment.certificateEligible ? 
                      'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Award className={`h-8 w-8 ${
                            enrollment.certificateIssued ? 'text-emerald-600' : 
                            enrollment.certificateEligible ? 'text-amber-600' : 'text-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium">
                              {enrollment.certificateIssued ? 'Certificate Issued' : 
                               enrollment.certificateEligible ? 'Certificate Ready' : 'Certificate Status'}
                            </p>
                            <p className="text-sm">
                              {enrollment.certificateIssued ? 'Download your certificate' : 
                               enrollment.certificateEligible ? 'You are eligible for a certificate' : 
                               'Complete course requirements for certificate'}
                            </p>
                          </div>
                        </div>
                        {enrollment.certificateEligible && !enrollment.certificateIssued && (
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader className="bg-emerald-50 border-b border-emerald-200">
              <CardTitle className="text-emerald-900">Course Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm pt-6">
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
              {enrollment && (
                <>
                  <Separator className="bg-emerald-200" />
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Enrolled Since</span>
                    <span className="text-emerald-900">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {course.requirements.length > 0 && (
            <Card className="bg-white border-emerald-200 shadow-sm">
              <CardHeader className="bg-emerald-50 border-b border-emerald-200">
                <CardTitle className="text-emerald-900">Prerequisites</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2 text-sm text-emerald-800">
                  {course.requirements.map((req) => (
                    <li key={req.id} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      {req.requirement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white border-emerald-200 shadow-sm">
            <CardHeader className="bg-emerald-50 border-b border-emerald-200">
              <CardTitle className="text-emerald-900">Curriculum Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700">Modules</span>
                </div>
                <span className="font-semibold text-emerald-900">{course.curriculum?.totalModules || 0}</span>
              </div>
              <Separator className="bg-emerald-200" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700">Lessons</span>
                </div>
                <span className="font-semibold text-emerald-900">{course.curriculum?.totalLessons || 0}</span>
              </div>
              <Separator className="bg-emerald-200" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">Assessments</span>
                </div>
                <span className="font-semibold text-blue-900">{enrollment?.totalAssessments || 0}</span>
              </div>
              {course.hasFinalAssessment && (
                <>
                  <Separator className="bg-emerald-200" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-700">Final Exam</span>
                    </div>
                    <Badge variant="outline" className="border-purple-300 text-purple-700">
                      {course.finalAssessmentRequired ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
                  {enrollment?.progress === 0 ? 'Start Learning' : 'Continue Learning'}
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
              {/* {hasAssessments && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white border-blue-300 hover:bg-blue-50 text-blue-900 hover:text-blue-900" 
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
                className="w-full justify-start bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900 hover:text-emerald-900" 
                asChild
              >
                <Link href={`/dashboard/user/courses/${courseId}/progress`}>
                  <BarChart3 className="mr-2 h-4 w-4 text-emerald-600" />
                  Progress Report
                </Link>
              </Button> */}
              {enrollment?.certificateEligible && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white border-amber-300 hover:bg-amber-50 text-amber-900 hover:text-amber-900" 
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