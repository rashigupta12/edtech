/*eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  Layers,
  PlayCircle,
  Target,
  Video
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  videoDuration?: number;
  hasQuiz: boolean;
  quizRequired: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  hasAssessment: boolean;
  assessmentRequired: boolean;
  minimumPassingScore: number;
  moduleAssessment?: {
    id: string;
    title: string;
    passingScore: number;
    timeLimit?: number;
    questionCount: number;
  };
}

interface Assessment {
  id: string;
  title: string;
  assessmentLevel: 'LESSON_QUIZ' | 'MODULE_ASSESSMENT' | 'COURSE_FINAL';
  passingScore: number;
  timeLimit?: number;
  questionCount: number;
  isRequired: boolean;
}

interface Curriculum {
  modules: Module[];
  finalAssessment?: Assessment;
  courseTitle?: string;
}

interface ProgressData {
  enrollmentId: string;
  courseId: string;
  overallProgress: number;
  completedLessons: number;
  totalLessons: number;
  completedAssessments: number;
  totalAssessments: number;
  status: string;
  completedAt: string | null;
  overallScore: number;
  certificateEligible: boolean;
  lessonsProgress: Array<{
    id: string;
    title: string;
    moduleId: string;
    moduleTitle: string;
    contentType: string;
    hasQuiz: string;
    quizRequired: boolean;
    progress: {
      lessonId: string;
      isCompleted: boolean;
      completedAt: string | null;
      lastWatchedPosition: number;
      watchDuration: number;
      videoPercentageWatched: number;
      resourcesViewed: any;
      quizAttempted: boolean;
      quizPassed: boolean;
    } | null;
    isComplete: boolean;
    completionRules: any;
    quizResult: any;
  }>;
  moduleAssessmentStatus: Array<{
    moduleId: string;
    moduleTitle: string;
    assessmentId: string;
    assessmentTitle: string;
    hasAssessment: boolean;
    assessmentRequired: boolean;
    minimumPassingScore: number;
    passed: boolean;
    attempted: boolean;
    latestScore: number;
    latestAttemptId?: string;
  }>;
  finalAssessmentStatus: {
    id: string;
    title: string;
    passingScore: number;
    isRequired: boolean;
    passed: boolean;
    attempted: boolean;
    latestScore: number;
    latestAttemptId: string;
  } | null;
}

export default function SyllabusPage() {
  const user = useCurrentUser();
  const userId = user?.id;
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();

  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!courseId) return;

      try {
        setLoading(true);

        const [curriculumRes, progressRes] = await Promise.all([
          fetch(`/api/courses?id=${courseId}&curriculum=true`),
          userId ? fetch(`/api/progress?userId=${userId}&courseId=${courseId}`) : Promise.resolve(null),
        ]);

        const curriculumJson = await curriculumRes.json();
        setCurriculum(curriculumJson.data || null);

        if (progressRes && progressRes.ok) {
          const progressJson = await progressRes.json();
          console.log('Progress data:', progressJson.data); // Debug log
          setProgress(progressJson.data || null);
        }
      } catch (err) {
        console.error('Failed to load syllabus', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [courseId, userId]);

  const getLessonProgress = (lessonId: string) => {
    return progress?.lessonsProgress?.find(lp => lp.id === lessonId);
  };

  const getModuleAssessmentStatus = (moduleId: string) => {
    return progress?.moduleAssessmentStatus?.find(ms => ms.moduleId === moduleId);
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'VIDEO': return <Video className="h-4 w-4" />;
      case 'ARTICLE': return <FileText className="h-4 w-4" />;
      case 'QUIZ': return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-8 min-h-screen max-w-7xl mx-auto">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-48 w-full" />
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="p-6 text-center text-gray-600">
        <p>Course curriculum not found.</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="p-6 w-full mx-auto space-y-8 min-h-screen max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="space-y-3">
          <Button
            variant="ghost"
            className="pl-0 hover:bg-transparent text-gray-600 hover:text-gray-900"
            onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {curriculum.courseTitle || 'Course'} Syllabus
            </h1>
            <p className="text-gray-600 mt-2">
              Track your progress through all modules, lessons, and assessments
            </p>
          </div>
        </div>

        <Button 
          onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn`)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <PlayCircle className="mr-2 h-5 w-5" />
          Continue Learning
        </Button>
      </div>

      {/* Summary Stats - Using actual data from backend */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Modules</p>
                <p className="text-2xl font-bold text-gray-900">{curriculum.modules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Layers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lessons</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress?.totalLessons || curriculum.modules.reduce((s, m) => s + m.lessons.length, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {progress?.completedLessons || 0} completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Assessments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progress?.completedAssessments || 0} / {progress?.totalAssessments || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Passed: {progress?.completedAssessments || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-gray-900">{progress?.overallProgress || 0}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  Course status: {progress?.status || 'Not Started'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-green-600" />
            Your Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">Overall Course Progress</span>
                <span className="font-semibold text-gray-900">{progress?.overallProgress || 0}%</span>
              </div>
              <Progress value={progress?.overallProgress || 0} className="h-3" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">Lessons Completed</span>
                <span className="font-semibold text-gray-900">
                  {progress?.completedLessons || 0} of {progress?.totalLessons || 0}
                </span>
              </div>
              <Progress 
                value={progress && progress.totalLessons > 0 
                  ? Math.round((progress.completedLessons / progress.totalLessons) * 100)
                  : 0
                } 
                className="h-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{progress?.completedLessons || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Lessons Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{progress?.overallScore || 0}%</div>
                <div className="text-sm text-gray-600 mt-1">Average Score</div>
              </div>
            </div>

            {progress?.certificateEligible && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Certificate Eligible!</p>
                    <p className="text-sm text-green-700">
                      You have completed all requirements for a course certificate.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Curriculum Accordion */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Course Curriculum</h2>
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            {progress?.totalLessons || 0} lessons • {progress?.totalAssessments || 0} assessments
          </Badge>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {curriculum.modules.map((module, idx) => {
            const lessonProgresses = module.lessons.map(l => getLessonProgress(l.id));
            const completedLessonsInModule = lessonProgresses.filter(p => p?.progress?.isCompleted || p?.isComplete).length;
            const moduleProgressPct = module.lessons.length > 0 
              ? Math.round((completedLessonsInModule / module.lessons.length) * 100)
              : 0;
            const moduleAssessmentStatus = getModuleAssessmentStatus(module.id);

            return (
              <Card key={module.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                <AccordionItem value={module.id} className="border-0">
                  <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-gray-50/50">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center font-bold text-green-700 relative border border-green-100">
                          {idx + 1}
                          {moduleProgressPct === 100 && (
                            <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-lg text-gray-900">{module.title}</h3>
                          {module.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">{module.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                              {module.lessons.length} lessons
                            </Badge>
                            {module.hasAssessment && (
                              <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                                Assessment
                              </Badge>
                            )}
                          </div>
                          <Badge 
                            variant={moduleProgressPct === 100 ? 'default' : 'secondary'}
                            className={moduleProgressPct === 100 ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                          >
                            {moduleProgressPct}% Complete
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 pb-6 bg-gray-50/50">
                    {module.description && (
                      <>
                        <p className="text-gray-700 mb-4">{module.description}</p>
                        <Separator className="mb-6 bg-gray-200" />
                      </>
                    )}

                    {module.hasAssessment && moduleAssessmentStatus && (
                      <div className={`mb-6 p-4 rounded-lg border ${
                        moduleAssessmentStatus.passed ? 'bg-green-50 border-green-200' :
                        moduleAssessmentStatus.attempted ? 'bg-amber-50 border-amber-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Target className={`h-5 w-5 ${
                              moduleAssessmentStatus.passed ? 'text-green-600' :
                              moduleAssessmentStatus.attempted ? 'text-amber-600' : 'text-blue-600'
                            }`} />
                            <div>
                              <p className="font-medium text-gray-900">Module Assessment</p>
                              <div className="text-sm text-gray-600">
                                Passing Score: {module.minimumPassingScore}% • {module.moduleAssessment?.questionCount || '?'} questions
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={moduleAssessmentStatus.passed ? 'default' : 'secondary'}
                              className={
                                moduleAssessmentStatus.passed 
                                  ? 'bg-green-600 text-white' 
                                  : moduleAssessmentStatus.attempted 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-gray-100 text-gray-700'
                              }
                            >
                              {moduleAssessmentStatus.passed ? 'Passed' : 
                               moduleAssessmentStatus.attempted ? 'Failed' : 'Not Started'}
                            </Badge>
                            {moduleAssessmentStatus.attempted && moduleAssessmentStatus.latestScore !== undefined && (
                              <p className="text-sm text-gray-600 mt-1">
                                Score: {moduleAssessmentStatus.latestScore}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {module.lessons.map((lesson, lessonIdx) => {
                        const lp = getLessonProgress(lesson.id);
                        const isCompleted = lp?.progress?.isCompleted || lp?.isComplete;
                        const quizPassed = lp?.progress?.quizPassed || lp?.quizResult?.quizPassed;

                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {isCompleted ? (
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                                  {lessonIdx + 1}
                                </div>
                              )}

                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{lesson.title}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    {getContentTypeIcon(lesson.contentType)}
                                    <span>{lesson.contentType.toLowerCase()}</span>
                                  </div>
                                  {lesson.videoDuration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {Math.floor(lesson.videoDuration / 60)} min
                                    </span>
                                  )}
                                  {lesson.hasQuiz && (
                                    <Badge 
                                      variant="secondary"
                                      className={`text-xs ${
                                        quizPassed ? 'bg-green-100 text-green-700' : 
                                        lp?.progress?.quizAttempted ? 'bg-amber-100 text-amber-700' : 
                                        'bg-blue-50 text-blue-700'
                                      }`}
                                    >
                                      Quiz {quizPassed ? 'Passed' : lp?.progress?.quizAttempted ? 'Failed' : 'Pending'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant={isCompleted ? "outline" : "default"}
                              onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn?lesson=${lesson.id}`)}
                              className={isCompleted ? "border-gray-300" : "bg-green-600 hover:bg-green-700 text-white"}
                            >
                              {isCompleted ? 'Review' : 'Start'}
                              <PlayCircle className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex gap-3">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn?module=${module.id}`)}
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        Start Module
                      </Button>
                      {module.hasAssessment && module.moduleAssessment && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn?assessment=${module.moduleAssessment?.id}`)}
                        >
                          <Target className="mr-2 h-4 w-4" />
                          Take Assessment
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            );
          })}
        </Accordion>
      </div>

      {/* Final Assessment */}
      {curriculum.finalAssessment && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Award className="h-6 w-6 text-purple-600" />
              Final Course Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <h3 className="text-xl font-semibold">{curriculum.finalAssessment.title}</h3>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>Passing: {curriculum.finalAssessment.passingScore}%</span>
                  {curriculum.finalAssessment.timeLimit && <span>• {curriculum.finalAssessment.timeLimit} min</span>}
                  <span>• {curriculum.finalAssessment.questionCount} questions</span>
                </div>
                {progress?.finalAssessmentStatus && (
                  <div className="mt-3">
                    <Badge className="mb-2" variant={progress.finalAssessmentStatus.passed ? "default" : "secondary"}>
                      {progress.finalAssessmentStatus.passed ? 'Passed' : 
                       progress.finalAssessmentStatus.attempted ? 'Failed' : 'Not Started'}
                    </Badge>
                    {progress.finalAssessmentStatus.attempted && (
                      <p className="text-sm text-gray-600">
                        Score: {progress.finalAssessmentStatus.latestScore}%
                      </p>
                    )}
                  </div>
                )}
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn?assessment=${curriculum.finalAssessment?.id}`)}
              >
                {progress?.finalAssessmentStatus?.passed ? 'Review' : 'Take Final Exam'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}