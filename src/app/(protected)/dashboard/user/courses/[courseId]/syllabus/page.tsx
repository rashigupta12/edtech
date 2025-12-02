// src/app/dashboard/user/courses/[courseId]/syllabus/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle, 
  Clock, 
  PlayCircle, 
  ChevronLeft, 
  Award, 
  BookOpen, 
  Target,
  FileText,
  Video,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/auth';

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
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  completedAssessments: number;
  totalAssessments: number;
  lessonsProgress: Array<{
    lessonId: string;
    isCompleted: boolean;
    quizAttempted?: boolean;
    quizPassed?: boolean;
  }>;
  moduleAssessmentStatus?: Array<{
    moduleId: string;
    passed: boolean;
    attempted: boolean;
    latestScore?: number;
  }>;
  finalAssessmentStatus?: {
    passed: boolean;
    attempted: boolean;
    latestScore?: number;
  };
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
          userId ? fetch(`/api/progress?userId=${userId}&courseId=${courseId}`) : null,
        ]);

        const curriculumJson = await curriculumRes.json();
        setCurriculum(curriculumJson.data || null);

        if (progressRes?.ok) {
          const progressJson = await progressRes.json();
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
    return progress?.lessonsProgress?.find(lp => lp.lessonId === lessonId);
  };

  const getModuleAssessmentStatus = (moduleId: string) => {
    return progress?.moduleAssessmentStatus?.find(ms => ms.moduleId === moduleId);
  };

  const calculateModuleProgress = (module: Module) => {
    if (!module.lessons.length || !progress) return 0;
    const completed = module.lessons.filter(
      lesson => getLessonProgress(lesson.id)?.isCompleted
    ).length;
    return Math.round((completed / module.lessons.length) * 100);
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'ARTICLE':
        return <FileText className="h-4 w-4" />;
      case 'QUIZ':
        return <Target className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const totalLessons = curriculum?.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  ) || 0;

  const totalAssessments = () => {
    let count = 0;
    curriculum?.modules.forEach(module => {
      if (module.hasAssessment) count++;
      count += module.lessons.filter(lesson => lesson.hasQuiz).length;
    });
    if (curriculum?.finalAssessment) count++;
    return count;
  };

  const completedAssessments = () => {
    let count = 0;
    
    // Count completed module assessments
    progress?.moduleAssessmentStatus?.forEach(status => {
      if (status.passed) count++;
    });
    
    // Count completed lesson quizzes
    progress?.lessonsProgress?.forEach(lesson => {
      if (lesson.quizPassed) count++;
    });
    
    // Count final assessment
    if (progress?.finalAssessmentStatus?.passed) {
      count++;
    }
    
    return count;
  };

  const assessmentProgress = totalAssessments() > 0 
    ? Math.round((completedAssessments() / totalAssessments()) * 100)
    : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-8  min-h-screen">
        <Skeleton className="h-12 w-80 " />
        <Skeleton className="h-48 w-full " />
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl " />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full mx-auto space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <Button
            variant="ghost"
            className="mb-4 hover:bg-emerald-100 text-emerald-900"
            onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
          <h1 className="text-3xl font-bold text-emerald-900">
            {curriculum?.courseTitle || 'Course'} Syllabus
          </h1>
          <p className="text-emerald-700 mt-2">
            Complete overview of all modules, lessons, and assessments
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => router.push(`/dashboard/user/courses/${courseId}/assessments`)}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Target className="mr-2 h-4 w-4" />
            View Assessments
          </Button>
          <Button 
            onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Continue Learning
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-700">Modules</p>
                <p className="text-2xl font-bold text-emerald-900">{curriculum?.modules.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Lessons</p>
                <p className="text-2xl font-bold text-blue-900">{totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Assessments</p>
                <p className="text-2xl font-bold text-purple-900">{totalAssessments()}</p>
                <p className="text-xs text-purple-600 mt-1">
                  {completedAssessments()} completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-700">Overall Progress</p>
                <p className="text-2xl font-bold text-amber-900">{progress?.progressPercentage || 0}%</p>
                <p className="text-xs text-amber-600 mt-1">
                  {progress?.completedLessons || 0}/{progress?.totalLessons || 0} lessons
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2 text-emerald-900">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Course Progress
                </span>
                <span className="font-semibold">{progress?.progressPercentage || 0}%</span>
              </div>
              <Progress value={progress?.progressPercentage || 0} className="h-3" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2 text-blue-900">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Assessment Progress
                </span>
                <span className="font-semibold">{assessmentProgress}%</span>
              </div>
              <Progress value={assessmentProgress} className="h-3 bg-blue-100" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-900">{progress?.completedLessons || 0}</div>
                <div className="text-sm text-emerald-600">Lessons Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900">{completedAssessments()}</div>
                <div className="text-sm text-purple-600">Assessments Passed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Curriculum Accordion */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-emerald-900">Course Curriculum</h2>
          <Badge variant="outline" className="border-emerald-600 text-emerald-700">
            {totalLessons} lessons • {totalAssessments()} assessments
          </Badge>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {curriculum?.modules.map((module, idx) => {
            const moduleProgress = calculateModuleProgress(module);
            const moduleAssessmentStatus = getModuleAssessmentStatus(module.id);
            const hasQuizLessons = module.lessons.filter(l => l.hasQuiz).length;

            return (
              <Card key={module.id} className="bg-white border-emerald-200 shadow-sm overflow-hidden">
                <AccordionItem value={module.id} className="border-0">
                  <AccordionTrigger className="px-6 py-5 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 relative">
                          {idx + 1}
                          {moduleProgress === 100 && (
                            <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-lg text-emerald-900">{module.title}</h3>
                          {module.description && (
                            <p className="text-sm text-emerald-700 mt-1 line-clamp-1">
                              {module.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-emerald-50">
                              {module.lessons.length} lessons
                            </Badge>
                            {hasQuizLessons > 0 && (
                              <Badge variant="outline" className="border-blue-600 text-blue-700 bg-blue-50">
                                {hasQuizLessons} quizzes
                              </Badge>
                            )}
                          </div>
                          <Badge 
                            variant={moduleProgress === 100 ? 'default' : 'secondary'}
                            className={moduleProgress === 100 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}
                          >
                            {moduleProgress}% complete
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 pb-6 bg-emerald-50/30">
                    {/* Module Description */}
                    {module.description && (
                      <>
                        <p className="text-emerald-700 mb-4">{module.description}</p>
                        <Separator className="mb-6 bg-emerald-200" />
                      </>
                    )}

                    {/* Module Assessment Info */}
                    {module.hasAssessment && (
                      <div className={`mb-6 p-4 rounded-lg border ${
                        moduleAssessmentStatus?.passed ? 'bg-emerald-50 border-emerald-200' :
                        moduleAssessmentStatus?.attempted ? 'bg-amber-50 border-amber-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Target className={`h-6 w-6 ${
                              moduleAssessmentStatus?.passed ? 'text-emerald-600' :
                              moduleAssessmentStatus?.attempted ? 'text-amber-600' : 'text-blue-600'
                            }`} />
                            <div>
                              <p className="font-medium text-gray-900">Module Assessment</p>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                <span>Passing Score: {module.minimumPassingScore}%</span>
                                {module.moduleAssessment?.timeLimit && (
                                  <span>• Time Limit: {module.moduleAssessment.timeLimit} min</span>
                                )}
                                {module.moduleAssessment?.questionCount && (
                                  <span>• {module.moduleAssessment.questionCount} questions</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={moduleAssessmentStatus?.passed ? 'default' : 
                                      moduleAssessmentStatus?.attempted ? 'secondary' : 'outline'}
                              className={
                                moduleAssessmentStatus?.passed ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                                moduleAssessmentStatus?.attempted ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                                'border-blue-300 text-blue-700'
                              }
                            >
                              {moduleAssessmentStatus?.passed ? 'Passed' : 
                               moduleAssessmentStatus?.attempted ? 'Failed' : 
                               module.assessmentRequired ? 'Required' : 'Optional'}
                            </Badge>
                            {moduleAssessmentStatus?.attempted && moduleAssessmentStatus.latestScore && (
                              <p className="text-sm mt-1 text-gray-600">
                                Score: {moduleAssessmentStatus.latestScore}%
                              </p>
                            )}
                          </div>
                        </div>
                        {module.assessmentRequired && !moduleAssessmentStatus?.passed && (
                          <div className="mt-3 p-3 bg-white rounded border border-amber-200">
                            <div className="flex items-center gap-2 text-amber-700">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">
                                {moduleAssessmentStatus?.attempted 
                                  ? 'Retake required to pass this module'
                                  : 'Must be passed to complete this module'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Module Progress */}
                    <div className="mb-6 bg-white p-4 rounded-lg border border-emerald-200">
                      <div className="flex justify-between text-sm mb-2 text-emerald-900">
                        <span>Module Progress</span>
                        <span className="font-semibold">{moduleProgress}%</span>
                      </div>
                      <Progress value={moduleProgress} className="h-2 bg-emerald-100" />
                    </div>

                    {/* Lessons */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-2">Lessons</h4>
                      {module.lessons.map((lesson, lessonIdx) => {
                        const lessonProgress = getLessonProgress(lesson.id);
                        const isCompleted = lessonProgress?.isCompleted;

                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              {isCompleted ? (
                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full border-2 border-emerald-300 flex items-center justify-center text-sm font-medium text-emerald-700">
                                  {lessonIdx + 1}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-emerald-900 truncate">{lesson.title}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-emerald-700">
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs border-emerald-600 text-emerald-700 bg-emerald-50 flex items-center gap-1"
                                  >
                                    {getContentTypeIcon(lesson.contentType)}
                                    {lesson.contentType}
                                  </Badge>
                                  {lesson.videoDuration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {Math.floor(lesson.videoDuration / 60)} min
                                    </span>
                                  )}
                                  {lesson.hasQuiz && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs border-blue-600 text-blue-700 bg-blue-50 flex items-center gap-1 ${
                                        lessonProgress?.quizPassed ? 'border-emerald-600 text-emerald-700 bg-emerald-50' :
                                        lessonProgress?.quizAttempted ? 'border-amber-600 text-amber-700 bg-amber-50' : ''
                                      }`}
                                    >
                                      <Target className="h-3 w-3" />
                                      Quiz {lesson.quizRequired ? 'Required' : 'Optional'}
                                      {lessonProgress?.quizPassed && ' ✓'}
                                    </Badge>
                                  )}
                                </div>
                                {lesson.description && (
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/dashboard/user/courses/${courseId}/learn?lesson=${lesson.id}`)
                              }
                              className="bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900 whitespace-nowrap"
                            >
                              {isCompleted ? 'Review' : 'Start'}
                              <PlayCircle className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Module Actions */}
                    <div className="mt-6 flex gap-3">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => router.push(`/dashboard/user/courses/${courseId}/modules/${module.id}`)}
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        View Module Details
                      </Button>
                      {module.hasAssessment && (
                        <Button
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            if (module.moduleAssessment) {
                              router.push(`/dashboard/user/courses/${courseId}/learn?assessment=${module.moduleAssessment.id}`);
                            }
                          }}
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
      {curriculum?.finalAssessment && (
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-sm">
          <CardHeader className="border-b border-purple-200">
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <div className="p-2 bg-white rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              Final Course Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-purple-900">{curriculum.finalAssessment.title}</h3>
                <div className="flex items-center gap-4 text-sm text-purple-700">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Passing Score: {curriculum.finalAssessment.passingScore}%</span>
                  </div>
                  {curriculum.finalAssessment.timeLimit && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Time Limit: {curriculum.finalAssessment.timeLimit} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{curriculum.finalAssessment.questionCount} questions</span>
                  </div>
                </div>
                {progress?.finalAssessmentStatus && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                    progress.finalAssessmentStatus.passed ? 'bg-emerald-100 text-emerald-800' :
                    progress.finalAssessmentStatus.attempted ? 'bg-amber-100 text-amber-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    <Badge 
                      variant={progress.finalAssessmentStatus.passed ? 'default' : 
                              progress.finalAssessmentStatus.attempted ? 'secondary' : 'outline'}
                      className={
                        progress.finalAssessmentStatus.passed ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                        progress.finalAssessmentStatus.attempted ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' :
                        'border-purple-300 text-purple-700'
                      }
                    >
                      {progress.finalAssessmentStatus.passed ? 'Passed' : 
                       progress.finalAssessmentStatus.attempted ? 'Attempted' : 'Not Attempted'}
                    </Badge>
                    {progress.finalAssessmentStatus.latestScore && (
                      <span className="text-sm">
                        Score: {progress.finalAssessmentStatus.latestScore}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn?assessment=${curriculum.finalAssessment?.id}`)}
                disabled={!curriculum.finalAssessment.isRequired && curriculum.finalAssessment.isRequired === undefined}
              >
                {progress?.finalAssessmentStatus?.passed ? 'Review Assessment' : 'Take Final Assessment'}
              </Button>
            </div>
            {!curriculum.finalAssessment.isRequired && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700">
                  <span className="font-medium">Note:</span> This final assessment is optional but recommended for 
                  comprehensive learning evaluation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completion Requirements */}
      <Card className="bg-white border-emerald-200 shadow-sm">
        <CardHeader className="border-b border-emerald-200">
          <CardTitle className="text-emerald-900 flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            Course Completion Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-emerald-900">Learning Requirements</h4>
              <ul className="space-y-2 text-sm text-emerald-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Complete all required lessons
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Watch video content fully (if applicable)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  Pass all required lesson quizzes
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-purple-900">Assessment Requirements</h4>
              <ul className="space-y-2 text-sm text-purple-800">
                <li className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  Pass all required module assessments
                </li>
                {curriculum?.finalAssessment?.isRequired && (
                  <li className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    Pass the final course assessment
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  Achieve minimum overall passing score
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}