/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import AssessmentStartDialog from '@/components/user/courses/AssessmentStartDialog';
import AssessmentTimer from '@/components/user/courses/AssessmentTimer';
import { Assessment, AssessmentAttempt, Curriculum, formatTime, formatVideoUrl, Lesson, LessonProgress, safeJson, UserAssessmentAttempt } from '@/components/user/courses/learn';
import { useCurrentUser } from '@/hooks/auth';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  PlayCircle,
  RefreshCw,
  Target,
  Video,
  XCircle
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';

export interface ProgressResponse {
  enrollmentId: string;
  courseId: string;
  overallProgress: number; // Changed from progressPercentage
  completedLessons: number;
  totalLessons: number;
  completedAssessments: number;
  totalAssessments: number;
  status: string;
  completedAt: string | null;
  overallScore: number;
  certificateEligible: boolean;
  lessonsProgress: {
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
    } | null;
    isComplete: boolean;
    completionRules: any;
    quizResult: any;
  }[];
  moduleAssessmentStatus: any[];
  finalAssessmentStatus: any;
  // Add this if your API returns assessment attempts
  assessmentAttempts?: Record<string, UserAssessmentAttempt[]>;
}


// --- Main Component ---
export default function CourseLearnPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?.id ?? null;

  // Data states
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [assessmentAttempt, setAssessmentAttempt] = useState<AssessmentAttempt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProgressLoading, setIsProgressLoading] = useState<boolean>(false);
  const [isAssessmentLoading, setIsAssessmentLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [playerPosition, setPlayerPosition] = useState<number>(0);
  
  // Assessment state
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [assessmentResults, setAssessmentResults] = useState<{
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    passingScore: number;
    correctAnswers: number;
    totalQuestions: number;
    attemptId: string;
  } | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [showStartDialog, setShowStartDialog] = useState<boolean>(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Refs
  const progressTimeoutRef = useRef<number | null>(null);
  const latestPositionRef = useRef<number>(0);

  // Fetch curriculum
  useEffect(() => {
    let mounted = true;

    async function fetchCurriculum() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/courses?id=${encodeURIComponent(courseId)}&curriculum=true`);
        if (!res.ok) throw new Error('Failed to fetch curriculum');
        const json = await safeJson(res);
        if (!mounted) return;
        
        const modules = json?.data?.modules || [];
        if (modules.length === 0) {
          throw new Error('No curriculum found for this course');
        }
        
        setCurriculum({
          modules,
          courseTitle: json?.data?.courseTitle || 'Untitled Course',
          finalAssessment: json?.data?.finalAssessment || null
        });

        const firstLesson = modules?.[0]?.lessons?.[0];
        if (firstLesson) {
          setSelectedLessonId(firstLesson.id);
          setSelectedModuleId(modules[0].id);
        }
      } catch (err) {
        console.error('fetchCurriculum error', err);
        setError(err instanceof Error ? err.message : 'Failed to load course content');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (courseId) fetchCurriculum();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  // Fetch progress
  useEffect(() => {
    let mounted = true;
    if (!userId || !courseId) return;

    async function fetchProgress() {
      setIsProgressLoading(true);
      try {
        const res = await fetch(
          `/api/progress?userId=${encodeURIComponent(userId??"")}&courseId=${encodeURIComponent(courseId)}`
        );
        if (!res.ok) throw new Error('Failed to fetch progress');
        const json = await safeJson(res);
        if (!mounted) return;
        
        setProgress(json?.data ?? null);

        if (selectedLessonId) {
          const lp = json?.data?.lessonsProgress?.find(
            (x: LessonProgress) => x.lessonId === selectedLessonId
          );
          if (lp) {
            setPlayerPosition(lp.lastWatchedPosition ?? 0);
          }
        }
      } catch (err) {
        console.error('fetchProgress error', err);
      } finally {
        if (mounted) setIsProgressLoading(false);
      }
    }

    fetchProgress();

    return () => {
      mounted = false;
    };
  }, [userId, courseId, selectedLessonId]);

  // Start assessment with confirmation
  const handleStartAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowStartDialog(true);
  };

  const confirmStartAssessment = async () => {
    if (!selectedAssessment || !userId || !progress?.enrollmentId) return;
    
    setShowStartDialog(false);
    setIsAssessmentLoading(true);
    
    try {
      // Start new attempt
      const res = await fetch('/api/assessment-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: selectedAssessment.id,
          userId,
          enrollmentId: progress.enrollmentId,
          status: 'IN_PROGRESS',
          startedAt: new Date().toISOString(),
        }),
      });
      
      if (!res.ok) throw new Error('Failed to start assessment');
      
      const data = await res.json();
      setAssessmentAttempt(data.data);
      setCurrentAssessment(selectedAssessment);
      setUserAnswers({});
      setAssessmentResults(null);
      setShowResults(false);
      setIsTimerPaused(false);
      
      // Set initial answers from previous attempt if retaking
      if (data.data.answers) {
        setUserAnswers(data.data.answers);
      }
      
      // Scroll to assessment
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Start assessment error:', err);
      setError('Failed to start assessment');
    } finally {
      setIsAssessmentLoading(false);
      setSelectedAssessment(null);
    }
  };

  // Submit assessment
  const submitAssessment = async () => {
    if (!currentAssessment || !assessmentAttempt || !userId) return;
    
    setIsAssessmentLoading(true);
    try {
      // Calculate score
      let score = 0;
      let correctAnswers = 0;
      
      currentAssessment.questions.forEach(question => {
        const userAnswer = userAnswers[question.id];
        if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
          if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
            if (userAnswer === question.correctAnswer) {
              score += question.points;
              correctAnswers++;
            } else if (question.negativePoints) {
              score -= question.negativePoints;
            }
          } else if (question.questionType === 'SHORT_ANSWER') {
            if (userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
              score += question.points;
              correctAnswers++;
            }
          } else if (question.questionType === 'ESSAY') {
            // For essay questions, award full points if answered
            score += question.points;
            correctAnswers++;
          }
        }
      });

      const totalPoints = currentAssessment.questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      const passed = percentage >= currentAssessment.passingScore;

      // Update attempt - Send ID in request body
      const res = await fetch('/api/assessment-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submit: true,
          id: assessmentAttempt.id, // Include ID in body
          answers: userAnswers,
          score,
          percentage,
          passed,
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
          timeSpent: Math.floor((Date.now() - new Date(assessmentAttempt.startedAt).getTime()) / 1000),
        }),
      });

      if (!res.ok) throw new Error('Failed to submit assessment');
      
      const updatedAttempt = await res.json();
      
      setAssessmentResults({
        score,
        totalPoints,
        percentage,
        passed,
        passingScore: currentAssessment.passingScore,
        correctAnswers,
        totalQuestions: currentAssessment.questions.length,
        attemptId: assessmentAttempt.id,
      });
      
      setShowResults(true);
      
      // Refresh progress to update attempts list
      if (progress?.enrollmentId) {
        const progressRes = await fetch(
          `/api/progress?userId=${encodeURIComponent(userId)}&courseId=${encodeURIComponent(courseId)}`
        );
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setProgress(progressData.data);
        }
      }
      
      // Mark lesson as complete if assessment is passed and is lesson quiz
      if (passed && selectedLessonId && currentAssessment.assessmentLevel === 'LESSON_QUIZ') {
        await markLessonComplete(selectedLessonId);
      }
      
    } catch (err) {
      console.error('Submit assessment error:', err);
      setError('Failed to submit assessment');
    } finally {
      setIsAssessmentLoading(false);
    }
  };

  // Time up handler
  const handleTimeUp = () => {
    submitAssessment();
  };

// Since assessmentAttempts might not be in the API response yet:
const getPreviousAttempts = (assessmentId: string): UserAssessmentAttempt[] => {
  if (!progress?.assessmentAttempts) {
    // Check moduleAssessmentStatus and finalAssessmentStatus
    if (curriculum && assessmentId === curriculum.finalAssessment?.id) {
      return progress?.finalAssessmentStatus?.attempted ? [{
        id: progress.finalAssessmentStatus.latestAttemptId || '',
        score: progress.finalAssessmentStatus.latestScore || 0,
        percentage: progress.finalAssessmentStatus.latestScore || 0,
        passed: progress.finalAssessmentStatus.passed || false,
        status: 'COMPLETED',
        startedAt: new Date().toISOString(),
        timeSpent: 0
      }] : [];
    }
    
    // Check module assessments
    const moduleAssessment = progress?.moduleAssessmentStatus?.find(
      (m: any) => m.assessmentId === assessmentId
    );
    if (moduleAssessment) {
      return moduleAssessment.attempted ? [{
        id: moduleAssessment.latestAttemptId || '',
        score: moduleAssessment.latestScore || 0,
        percentage: moduleAssessment.latestScore || 0,
        passed: moduleAssessment.passed || false,
        status: 'COMPLETED',
        startedAt: new Date().toISOString(),
        timeSpent: 0
      }] : [];
    }
    
    return [];
  }
  
  return progress.assessmentAttempts[assessmentId] || [];
};
  // Get current assessment progress
  const getAssessmentProgress = () => {
    if (!currentAssessment) return { answered: 0, total: 0, percentage: 0 };
    
    const answered = Object.keys(userAnswers).filter(
      key => userAnswers[key] !== undefined && userAnswers[key] !== '' && userAnswers[key] !== null
    ).length;
    
    return {
      answered,
      total: currentAssessment.questions.length,
      percentage: Math.round((answered / currentAssessment.questions.length) * 100)
    };
  };

  // Toggle timer pause
  const toggleTimerPause = () => {
    setIsTimerPaused(!isTimerPaused);
  };
async function markLessonComplete(lessonId: string) {
  if (!userId) return;
  try {
    await fetch(
      `/api/progress?userId=${encodeURIComponent(userId)}&lessonId=${encodeURIComponent(lessonId)}&complete=true`,
      { method: 'POST' }
    );

    const res = await fetch(
      `/api/progress?userId=${encodeURIComponent(userId)}&courseId=${encodeURIComponent(courseId)}`
    );
    const json = await safeJson(res);
    setProgress(json?.data ?? null);
    
    // Update local state for immediate feedback
    if (progress?.lessonsProgress) {
      const updatedProgress = { ...progress };
      const lessonIndex = updatedProgress.lessonsProgress.findIndex(
        (lp: any) => lp.id === lessonId
      );
      if (lessonIndex !== -1) {
        if (!updatedProgress.lessonsProgress[lessonIndex].progress) {
          updatedProgress.lessonsProgress[lessonIndex].progress = {
            lessonId,
            isCompleted: true,
            completedAt: new Date().toISOString(),
            lastWatchedPosition: 0,
            watchDuration: 0,
            videoPercentageWatched: 100,
          };
        } else {
          updatedProgress.lessonsProgress[lessonIndex].progress.isCompleted = true;
          updatedProgress.lessonsProgress[lessonIndex].progress.completedAt = new Date().toISOString();
        }
        updatedProgress.lessonsProgress[lessonIndex].isComplete = true;
        
        // Recalculate overall progress
        const completedLessons = updatedProgress.lessonsProgress.filter(
          (lp: any) => lp.isComplete
        ).length;
        updatedProgress.overallProgress = Math.round(
          (completedLessons / updatedProgress.lessonsProgress.length) * 100
        );
        
        setProgress(updatedProgress);
      }
    }
  } catch (err) {
    console.error('markLessonComplete error', err);
  }
}
  // Send progress update
  async function sendProgressUpdate(lessonId: string, position: number) {
    if (!userId) return;
    try {
      await fetch(`/api/progress?userId=${encodeURIComponent(userId)}&lessonId=${encodeURIComponent(lessonId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastWatchedPosition: Math.floor(position) }),
      });
    } catch (err) {
      console.error('sendProgressUpdate error', err);
    }
  }

  const handleProgressUpdate = (positionSec: number) => {
    latestPositionRef.current = positionSec;

    if (progressTimeoutRef.current) {
      window.clearTimeout(progressTimeoutRef.current);
    }

    progressTimeoutRef.current = window.setTimeout(() => {
      if (selectedLessonId) {
        sendProgressUpdate(selectedLessonId, latestPositionRef.current);
      }
      progressTimeoutRef.current = null;
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (progressTimeoutRef.current && selectedLessonId) {
        sendProgressUpdate(selectedLessonId, latestPositionRef.current).catch(() => {});
      }
    };
  }, [selectedLessonId]);

  // Derived data
  const allLessons = curriculum?.modules?.flatMap((m) => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === selectedLessonId);
  const nextLesson = currentIndex >= 0 ? allLessons[currentIndex + 1] ?? null : null;
  const prevLesson = currentIndex >= 0 ? allLessons[currentIndex - 1] ?? null : null;
  const selectedLesson = allLessons.find((l) => l.id === selectedLessonId);
  const formattedVideoUrl = selectedLesson?.videoUrl ? formatVideoUrl(selectedLesson.videoUrl) : null;

// In the component, update the getLessonProgress function:
const getLessonProgress = (lessonId: string): LessonProgress | undefined => {
  const lessonProgress = progress?.lessonsProgress?.find(
    (lp: any) => lp.id === lessonId
  );
  
  if (!lessonProgress?.progress) return undefined;
  
  return {
    lessonId: lessonProgress.id,
    lessonTitle: lessonProgress.title,
    isCompleted: lessonProgress.progress.isCompleted,
    completedAt: lessonProgress.progress.completedAt,
    lastWatchedPosition: lessonProgress.progress.lastWatchedPosition,
    watchDuration: lessonProgress.progress.watchDuration,
    overallProgress: lessonProgress.progress.videoPercentageWatched || 0,
  };
};

  // Lesson selection handler
 const handleLessonSelect = (lessonId: string, moduleId: string) => {
  setSelectedLessonId(lessonId);
  setSelectedModuleId(moduleId);
  
  // Get the saved position from progress
  const lessonProgress = progress?.lessonsProgress?.find(
    (lp: any) => lp.id === lessonId
  );
  const savedPosition = lessonProgress?.progress?.lastWatchedPosition || 0;
  setPlayerPosition(savedPosition);
  
  setCurrentAssessment(null);
  setAssessmentAttempt(null);
  setUserAnswers({});
  setAssessmentResults(null);
  setShowResults(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
  // Error state
  if (error) {
    return (
      <div className="space-y-6 min-h-screen p-6">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Back to Course
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 min-h-screen p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px] md:col-span-2" />
        </div>
      </div>
    );
  }

  // No curriculum
  if (!curriculum || curriculum.modules.length === 0) {
    return (
      <div className="text-center py-12 min-h-screen">
        <BookOpen className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-emerald-900">No content available</h3>
        <p className="text-emerald-700 mb-6">This course doesn&apos;t have any lessons yet.</p>
        <Button 
          onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Back to Course
        </Button>
      </div>
    );
  }

  // Assessment Results Component
  const AssessmentResults = () => {
    if (!assessmentResults || !currentAssessment) return null;

    const canRetake = currentAssessment.allowRetake && 
      (currentAssessment.maxAttempts === null || 
       getPreviousAttempts(currentAssessment.id).length < (currentAssessment.maxAttempts ?? Infinity));

    return (
      <div className="space-y-6">
        <div className={`p-6 rounded-lg ${
          assessmentResults.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        } border`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {assessmentResults.passed ? (
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
              <div>
                <h3 className="text-xl font-bold">
                  {assessmentResults.passed ? 'Assessment Passed!' : 'Assessment Failed'}
                </h3>
                <p className="text-sm text-gray-600">
                  {assessmentResults.passed 
                    ? 'Congratulations! You have successfully passed the assessment.'
                    : `You need ${assessmentResults.passingScore}% to pass. ${
                        canRetake ? 'Try again!' : 'Maximum attempts reached.'
                      }`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{assessmentResults.percentage}%</div>
              <div className="text-sm text-gray-600">
                Passing: {assessmentResults.passingScore}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-emerald-700">{assessmentResults.score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-700">
                {assessmentResults.correctAnswers}/{assessmentResults.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-purple-700">{assessmentResults.totalPoints}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-amber-700">
                {assessmentAttempt?.timeSpent ? formatTime(assessmentAttempt.timeSpent) : '--:--'}
              </div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>
          </div>
        </div>

        {currentAssessment.showCorrectAnswers && (
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Review Answers</h4>
            {currentAssessment.questions.map((question, index) => {
              const userAnswer = userAnswers[question.id];
              const isCorrect = question.questionType === 'ESSAY' 
                ? true // Essay questions are always "correct" if answered
                : userAnswer === question.correctAnswer;
              
              return (
                <div key={question.id} className={`p-4 rounded border ${
                  isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Question {index + 1}</span>
                        <Badge variant={question.difficulty === 'HARD' ? 'destructive' : 
                                       question.difficulty === 'MEDIUM' ? 'default' : 'secondary'}>
                          {question.difficulty}
                        </Badge>
                        {question.questionType !== 'ESSAY' && (
                          <Badge variant={isCorrect ? 'default' : 'destructive'}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold mb-2">{question.questionText}</p>
                      
                      {question.questionType === 'MULTIPLE_CHOICE' && question.options && (
                        <div className="space-y-2 ml-4">
                          {question.options.map((option: any, optIndex: number) => (
                            <div key={optIndex} className={`p-2 rounded ${
                              option === question.correctAnswer 
                                ? 'bg-emerald-100 border-emerald-300 border' 
                                : option === userAnswer && !isCorrect
                                ? 'bg-red-100 border-red-300 border'
                                : ''
                            }`}>
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded-full border ${
                                  option === question.correctAnswer 
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : option === userAnswer && !isCorrect
                                    ? 'bg-red-500 border-red-500'
                                    : 'border-gray-300'
                                }`} />
                                <span>{option}</span>
                                {option === question.correctAnswer && (
                                  <Badge className="ml-2 bg-emerald-500">Correct Answer</Badge>
                                )}
                                {option === userAnswer && !isCorrect && (
                                  <Badge className="ml-2 bg-red-500">Your Answer</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.questionType === 'TRUE_FALSE' && (
                        <div className="space-y-2 ml-4">
                          {['True', 'False'].map((option) => (
                            <div key={option} className={`p-2 rounded ${
                              option === question.correctAnswer 
                                ? 'bg-emerald-100 border-emerald-300 border' 
                                : option === userAnswer && option !== question.correctAnswer
                                ? 'bg-red-100 border-red-300 border'
                                : ''
                            }`}>
                              <div className="flex items-center gap-2">
                                <div className={`h-4 w-4 rounded-full border ${
                                  option === question.correctAnswer 
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : option === userAnswer && option !== question.correctAnswer
                                    ? 'bg-red-500 border-red-500'
                                    : 'border-gray-300'
                                }`} />
                                <span>{option}</span>
                                {option === question.correctAnswer && (
                                  <Badge className="ml-2 bg-emerald-500">Correct Answer</Badge>
                                )}
                                {option === userAnswer && option !== question.correctAnswer && (
                                  <Badge className="ml-2 bg-red-500">Your Answer</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(question.questionType === 'SHORT_ANSWER' || question.questionType === 'ESSAY') && (
                        <div className="space-y-2 ml-4">
                          {question.questionType === 'SHORT_ANSWER' && (
                            <div className="p-2 rounded bg-emerald-100 border-emerald-300 border">
                              <div className="font-medium text-emerald-700">Correct Answer:</div>
                              <div>{question.correctAnswer}</div>
                            </div>
                          )}
                          {userAnswer && (
                            <div className="p-2 rounded bg-blue-100 border-blue-300 border">
                              <div className="font-medium text-blue-700">Your Answer:</div>
                              <div className="whitespace-pre-wrap">{userAnswer}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="font-medium text-blue-700 mb-1">Explanation:</div>
                          <div className="text-sm">{question.explanation}</div>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold">{question.points} pts</div>
                      <div className="text-sm text-gray-600">Points</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          {canRetake && (
            <Button
              onClick={() => {
                setShowResults(false);
                handleStartAssessment(currentAssessment);
              }}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retake Assessment
            </Button>
          )}
          <Button
            onClick={() => {
              setShowResults(false);
              setCurrentAssessment(null);
              setAssessmentAttempt(null);
              setUserAnswers({});
              setAssessmentResults(null);
              
              // If this was a lesson quiz and passed, move to next lesson
              if (assessmentResults.passed && selectedLessonId && currentAssessment.assessmentLevel === 'LESSON_QUIZ') {
                const next = nextLesson;
                if (next) {
                  const module = curriculum.modules.find(m => 
                    m.lessons.some(l => l.id === next.id)
                  );
                  if (module) {
                    handleLessonSelect(next.id, module.id);
                  }
                }
              }
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Continue Learning
          </Button>
        </div>
      </div>
    );
  };

  // Assessment Component
  const AssessmentComponent = () => {
    if (!currentAssessment || !assessmentAttempt) return null;

    const progress = getAssessmentProgress();

    return (
      <div className="space-y-6">
        {/* Assessment Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-emerald-900">{currentAssessment.title}</h2>
              <p className="text-emerald-700 mt-1">{currentAssessment.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-emerald-50">
                {currentAssessment.assessmentLevel.replace('_', ' ')}
              </Badge>
              {assessmentAttempt.status === 'IN_PROGRESS' && (
                <Badge className="bg-amber-500">In Progress</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-emerald-50 rounded">
              <div className="font-bold text-emerald-700">{currentAssessment.questions.length}</div>
              <div className="text-sm text-emerald-600">Questions</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="font-bold text-blue-700">{currentAssessment.passingScore}%</div>
              <div className="text-sm text-blue-600">Passing Score</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded">
              <div className="font-bold text-amber-700">
                {progress.answered}/{progress.total}
              </div>
              <div className="text-sm text-amber-600">Answered</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="font-bold text-purple-700">
                {currentAssessment.timeLimit ? `${currentAssessment.timeLimit} min` : 'No Limit'}
              </div>
              <div className="text-sm text-purple-600">Time Limit</div>
            </div>
          </div>

          {currentAssessment.timeLimit && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <AssessmentTimer
                  timeLimit={currentAssessment.timeLimit} 
                  onTimeUp={handleTimeUp}
                  isPaused={isTimerPaused}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleTimerPause}
                        className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        {isTimerPaused ? (
                          <Eye className="h-4 w-4 mr-2" />
                        ) : (
                          <EyeOff className="h-4 w-4 mr-2" />
                        )}
                        {isTimerPaused ? 'Resume Timer' : 'Pause Timer'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isTimerPaused ? 'Resume the countdown timer' : 'Pause the countdown timer'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              <div className="text-sm text-gray-500 text-center">
                {progress.answered} of {progress.total} questions answered ({progress.percentage}%)
              </div>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {currentAssessment.questions.map((question, index) => {
            const userAnswer = userAnswers[question.id];
            const isAnswered = userAnswer !== undefined && userAnswer !== '' && userAnswer !== null;

            return (
              <div key={question.id} className={`p-6 border rounded-lg ${
                isAnswered ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                      isAnswered ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {question.questionType.replace('_', ' ')}
                        </span>
                        <Badge variant={
                          question.difficulty === 'HARD' ? 'destructive' :
                          question.difficulty === 'MEDIUM' ? 'default' : 'secondary'
                        }>
                          {question.difficulty}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Points: {question.points} {question.negativePoints > 0 && `| -${question.negativePoints} if wrong`}
                      </div>
                    </div>
                  </div>
                  {isAnswered && (
                    <Badge className="bg-emerald-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Answered
                    </Badge>
                  )}
                </div>

                <p className="text-lg font-medium mb-4">{question.questionText}</p>

                {/* Question Options */}
                {question.questionType === 'MULTIPLE_CHOICE' && question.options && (
                  <RadioGroup
                    value={userAnswer || ''}
                    onValueChange={(value) => setUserAnswers(prev => ({
                      ...prev,
                      [question.id]: value
                    }))}
                    className="space-y-3"
                  >
                    {question.options.map((option: any, optIndex: number) => (
                      <div key={optIndex} className={`flex items-center space-x-2 p-3 rounded border ${
                        userAnswer === option 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}>
                        <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                        <Label htmlFor={`${question.id}-${optIndex}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.questionType === 'TRUE_FALSE' && (
                  <RadioGroup
                    value={userAnswer || ''}
                    onValueChange={(value) => setUserAnswers(prev => ({
                      ...prev,
                      [question.id]: value
                    }))}
                    className="space-y-3"
                  >
                    {['True', 'False'].map((option) => (
                      <div key={option} className={`flex items-center space-x-2 p-3 rounded border ${
                        userAnswer === option 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}>
                        <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                        <Label htmlFor={`${question.id}-${option}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.questionType === 'SHORT_ANSWER' && (
                  <div className="space-y-2">
                    <Input
                      value={userAnswer || ''}
                      onChange={(e) => setUserAnswers(prev => ({
                        ...prev,
                        [question.id]: e.target.value
                      }))}
                      placeholder="Type your answer here..."
                      className="h-12"
                    />
                    <p className="text-sm text-gray-500">
                      Note: Answers are case-insensitive
                    </p>
                  </div>
                )}

                {question.questionType === 'ESSAY' && (
                  <div className="space-y-2">
                    <Textarea
                      value={userAnswer || ''}
                      onChange={(e) => setUserAnswers(prev => ({
                        ...prev,
                        [question.id]: e.target.value
                      }))}
                      placeholder="Type your essay answer here..."
                      className="min-h-[150px]"
                    />
                    <p className="text-sm text-gray-500">
                      Essay questions will be reviewed manually
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-6 bg-white p-4 border rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {progress.answered} of {progress.total} questions answered ({progress.percentage}%)
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (confirm('Are you sure you want to leave? Your progress will be saved.')) {
                    setCurrentAssessment(null);
                    setAssessmentAttempt(null);
                  }
                }}
                variant="outline"
                className="border-gray-300"
              >
                Save & Exit
              </Button>
              <Button
                onClick={submitAssessment}
                disabled={progress.answered < progress.total}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                size="lg"
              >
                {isAssessmentLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckSquare className="mr-2 h-5 w-5" />
                    Submit Assessment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Lesson Content Component - FIXED
  const LessonContent = ({ lesson }: { lesson: Lesson}) => {
    const module = curriculum?.modules.find(m => 
      m.lessons.some(l => l.id === lesson.id)
    );
    const lessonProgress = getLessonProgress(lesson.id);
    
    // Get the quiz from lesson.quiz
    const lessonQuiz = lesson.quiz;

    return (
      <div className="space-y-6 p-6">
        {/* Lesson Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-emerald-900">{lesson.title}</h2>
            <div className="flex items-center gap-2">
              {/* Check if lesson has its own quiz */}
              {lessonQuiz && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleStartAssessment(lessonQuiz);
                  }}
                  size="sm"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Take Quiz
                </Button>
              )}
              <Button
                variant={lessonProgress?.isCompleted ? 'secondary' : 'outline'}
                onClick={() => markLessonComplete(lesson.id)}
                disabled={lessonProgress?.isCompleted}
                size="sm"
                className={
                  lessonProgress?.isCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900'
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {lessonProgress?.isCompleted ? 'Completed' : 'Mark Complete'}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-emerald-700">
            <div className="flex items-center gap-1">
              {lesson.contentType === 'VIDEO' && <Video className="h-4 w-4" />}
              {lesson.contentType === 'ARTICLE' && <FileText className="h-4 w-4" />}
              {lesson.contentType === 'QUIZ' && <Target className="h-4 w-4" />}
              <span className="capitalize">{lesson.contentType.toLowerCase()}</span>
            </div>
            {lesson.videoDuration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{Math.floor(lesson.videoDuration / 60)} min</span>
              </div>
            )}
            {lessonQuiz && (
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                <Target className="mr-1 h-3 w-3" />
                Has Quiz
              </Badge>
            )}
            {lesson.isFree && (
              <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                Free Preview
              </Badge>
            )}
          </div>
          
          {lesson.description && (
            <p className="text-emerald-700 mt-2">{lesson.description}</p>
          )}
        </div>

        <Separator className="bg-emerald-200" />

        {/* Lesson Content */}
        {lesson.contentType === 'VIDEO' ? (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {formattedVideoUrl ? (
                <ReactPlayer
                  url={formattedVideoUrl}
                  width="100%"
                  height="100%"
                  controls
                  playing={false}
                  onProgress={({ playedSeconds }: { playedSeconds: number }) => {
                    setPlayerPosition(playedSeconds);
                    handleProgressUpdate(playedSeconds);
                  }}
                  onEnded={() => {
                    markLessonComplete(lesson.id);
                  }}
                  onError={(e: any) => {
                    console.error('ReactPlayer error:', e);
                  }}
                  progressInterval={1000}
                  config={{
                    youtube: {
                      playerVars: {
                        modestbranding: 1,
                        rel: 0,
                        origin: window.location.origin,
                      },
                      embedOptions: {
                        host: 'https://www.youtube-nocookie.com'
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Video URL not available</p>
                  </div>
                </div>
              )}
            </div>
            {formattedVideoUrl && (
              <div className="text-xs text-emerald-700">
                <p>Video URL: {formattedVideoUrl}</p>
                <p className="mt-1">If the video doesn&apos;t load, try opening it directly: 
                  <a 
                    href={formattedVideoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline ml-1"
                  >
                    Open in YouTube
                  </a>
                </p>
              </div>
            )}
            {!formattedVideoUrl && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Video URL is missing or invalid. Please contact support.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : lesson.contentType === 'ARTICLE' ? (
          <div className="space-y-4">
            <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none prose-emerald">
              {(lesson.articleContent || lesson.description) ? (
                <div className="p-6 bg-emerald-50 rounded-lg">
                  {lesson.articleContent ? (
                    <div dangerouslySetInnerHTML={{ __html: lesson.articleContent }} />
                  ) : (
                    <div className="whitespace-pre-line text-base leading-relaxed text-emerald-900">
                      {lesson.description}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                  <p className="text-emerald-700">Article content not available</p>
                </div>
              )}
            </div>
          </div>
        ) : lesson.contentType === 'QUIZ' ? (
          <div className="space-y-4">
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-8 w-8 text-amber-600" />
                <div>
                  <h3 className="font-bold text-lg text-amber-900">Lesson Quiz</h3>
                  <p className="text-amber-700">
                    Test your understanding of this lesson by taking the quiz.
                  </p>
                </div>
              </div>
              
              {lessonQuiz ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded border">
                      <div className="font-bold text-amber-700">{lessonQuiz.questions?.length || 0}</div>
                      <div className="text-sm text-gray-600">Questions</div>
                    </div>
                    <div className="p-3 bg-white rounded border">
                      <div className="font-bold text-amber-700">{lessonQuiz.passingScore}%</div>
                      <div className="text-sm text-gray-600">Passing Score</div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleStartAssessment(lessonQuiz)}
                    disabled={isAssessmentLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isAssessmentLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        Loading Quiz...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-5 w-5" />
                        Start Quiz
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Quiz is not available yet. Please check back later.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        ) : null}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-emerald-200">
          <Button
            variant="outline"
            disabled={!prevLesson}
            onClick={() =>
              prevLesson && handleLessonSelect(
                prevLesson.id, 
                curriculum.modules.find((m) => m.lessons.some((l) => l.id === prevLesson.id))!.id
              )
            }
            className="bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900 disabled:opacity-50"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            {selectedModuleId && (
              <Button 
                variant="outline" 
                onClick={() => router.push(`/dashboard/user/courses/${courseId}/modules/${selectedModuleId}`)}
                className="bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900"
              >
                Module Overview
              </Button>
            )}
          </div>

          <Button
            disabled={!nextLesson}
            onClick={() =>
              nextLesson && handleLessonSelect(
                nextLesson.id, 
                curriculum.modules.find((m) => m.lessons.some((l) => l.id === nextLesson.id))!.id
              )
            }
            className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 min-h-screen ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Learning Interface</h1>
          <p className="text-emerald-700 mt-2">
            {curriculum.courseTitle} • Progress: {progress?.overallProgress ?? 0}%
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
          className="bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900"
        >
          Back to Course
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-emerald-900">
          <span>Overall Progress</span>
          <span>{progress?.overallProgress ?? 0}%</span>
        </div>
        <Progress value={progress?.overallProgress ?? 0} className="h-2" />
      </div>

      {/* Assessment Start Dialog */}
      {selectedAssessment && (
        <AssessmentStartDialog
          assessment={selectedAssessment}
          open={showStartDialog}
          onOpenChange={setShowStartDialog}
          onStart={confirmStartAssessment}
          previousAttempts={getPreviousAttempts(selectedAssessment.id)}
          isLoading={isAssessmentLoading}
        />
      )}

      {/* Assessment Results Modal */}
      {showResults && assessmentResults && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <AssessmentResults />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Sidebar - Curriculum */}
        <Card className="md:col-span-1 bg-white border-emerald-200">
          <CardContent className="p-0">
            <Tabs defaultValue="curriculum" className="h-full">
              <TabsList className="grid w-full grid-cols-2 bg-emerald-50">
                <TabsTrigger value="curriculum" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900">
                  Curriculum
                </TabsTrigger>
                <TabsTrigger value="assessments" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900">
                  Assessments
                </TabsTrigger>
              </TabsList>

              <TabsContent value="curriculum" className="p-4 h-[calc(100vh-200px)] overflow-y-auto">
                <div className="space-y-4">
                  {curriculum.modules.map((module) => {
                    const moduleAttempts = module.moduleAssessment 
                      ? getPreviousAttempts(module.moduleAssessment.id)
                      : [];
                    const hasPassedModuleAssessment = moduleAttempts.some(attempt => attempt.passed);

                    return (
                      <div key={module.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-emerald-900">{module.title}</h3>
                          <div className="flex items-center gap-2">
                            {module.moduleAssessment && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge className={`${
                                      hasPassedModuleAssessment 
                                        ? 'bg-emerald-500' 
                                        : 'bg-amber-500'
                                    } hover:bg-amber-600 text-white`}>
                                      <Target className="h-3 w-3 mr-1" />
                                      {hasPassedModuleAssessment ? 'Passed' : 'Quiz'}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{moduleAttempts.length} attempt(s)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-emerald-50">
                              {module.lessons.length} lessons
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-1">
                          {module.lessons.map((lesson) => {
                            const lessonProgress = getLessonProgress(lesson.id);
                            const isActive = lesson.id === selectedLessonId;
                            const lessonAttempts = lesson.quiz 
                              ? getPreviousAttempts(lesson.quiz.id)
                              : [];

                            return (
                              <Button
                                key={lesson.id}
                                variant={isActive ? 'secondary' : 'ghost'}
                                className={`w-full justify-start font-normal h-auto py-2 ${
                                  isActive 
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900' 
                                    : 'hover:bg-emerald-50 text-emerald-800'
                                }`}
                                onClick={() => handleLessonSelect(lesson.id, module.id)}
                              >
                                <div className="flex items-start gap-3">
                                  {lessonProgress?.isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <div className="h-4 w-4 rounded-full border border-emerald-300 mt-0.5 flex-shrink-0" />
                                  )}

                                  <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center gap-2">
                                      {lesson.contentType === 'VIDEO' && <Video className="h-3 w-3 flex-shrink-0 text-emerald-600" />}
                                      {lesson.contentType === 'ARTICLE' && <FileText className="h-3 w-3 flex-shrink-0 text-emerald-600" />}
                                      {lesson.contentType === 'QUIZ' && <Target className="h-3 w-3 flex-shrink-0 text-amber-600" />}
                                      <span className="truncate font-medium">{lesson.title}</span>
                                      {lesson.contentType === 'QUIZ' && (
                                        <Badge className="ml-2 bg-amber-500 hover:bg-amber-600 text-white text-xs">
                                          Quiz
                                        </Badge>
                                      )}
                                      {lessonAttempts.length > 0 && (
                                        <Badge variant="outline" className="ml-2 text-xs border-blue-300 text-blue-700">
                                          {lessonAttempts.length} attempt(s)
                                        </Badge>
                                      )}
                                    </div>

                                    {lesson.description && (
                                      <p className="text-xs text-emerald-700 mt-1 line-clamp-2">{lesson.description}</p>
                                    )}

                                    <div className="flex items-center gap-3 mt-1">
                                      {lesson.contentType === 'VIDEO' && lesson.videoDuration && (
                                        <span className="text-xs text-emerald-700 flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {Math.floor(lesson.videoDuration / 60)} min
                                        </span>
                                      )}
                                      {lesson.isFree && (
                                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                                          Free
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Button>
                            );
                          })}
                          
                          {/* Module Assessment Button */}
                          {module.moduleAssessment && (
                            <Button
                              variant="outline"
                              className="w-full justify-start mt-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                              onClick={() => handleStartAssessment(module.moduleAssessment!)}
                            >
                              <Target className="h-4 w-4 mr-2 text-amber-600" />
                              <div className="text-left">
                                <div className="font-medium">Module Assessment</div>
                                <div className="text-xs text-amber-600">
                                  {module.moduleAssessment.questions?.length || 0} questions • {module.moduleAssessment.passingScore}% to pass
                                  {moduleAttempts.length > 0 && ` • ${moduleAttempts.length} attempt(s)`}
                                </div>
                              </div>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Course Final Assessment */}
                  {curriculum.finalAssessment && (
                    <div className="mt-6 pt-6 border-t border-emerald-200">
                      <Button
                        variant="outline"
                        className="w-full justify-start border-purple-300 text-purple-700 hover:bg-purple-50 py-3"
                        onClick={() => handleStartAssessment(curriculum.finalAssessment!)}
                      >
                        <Award className="h-5 w-5 mr-2 text-purple-600" />
                        <div className="text-left">
                          <div className="font-medium">Final Course Assessment</div>
                          <div className="text-xs text-purple-600">
                            {curriculum.finalAssessment.questions?.length || 0} questions • {curriculum.finalAssessment.passingScore}% to pass
                            {getPreviousAttempts(curriculum.finalAssessment.id).length > 0 && 
                              ` • ${getPreviousAttempts(curriculum.finalAssessment.id).length} attempt(s)`}
                          </div>
                        </div>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="assessments" className="p-4">
                <div className="space-y-4">
                  <h3 className="font-bold text-lg text-emerald-900">All Assessments</h3>
                  
                  {/* Module Assessments */}
                  {curriculum.modules.filter(m => m.moduleAssessment).map(module => {
                    const attempts = getPreviousAttempts(module.moduleAssessment!.id);
                    const bestAttempt = attempts.length > 0 
                      ? attempts.reduce((best, attempt) => 
                          attempt.percentage > best.percentage ? attempt : best
                        )
                      : null;

                    return (
                      <div key={module.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-amber-600" />
                            <span className="font-medium">{module.title} Assessment</span>
                          </div>
                          <Badge className="bg-amber-500">Module</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {module.moduleAssessment?.description || 'Test your knowledge of this module'}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-bold">{module.moduleAssessment?.questions?.length || 0}</div>
                            <div className="text-gray-600">Questions</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="font-bold">{module.moduleAssessment?.passingScore}%</div>
                            <div className="text-gray-600">Passing Score</div>
                          </div>
                        </div>
                        
                        {attempts.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm font-medium text-gray-700 mb-1">Your Attempts:</div>
                            <div className="space-y-1">
                              {attempts.map((attempt, idx) => (
                                <div key={attempt.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${
                                      attempt.passed ? 'bg-emerald-500' : 'bg-red-500'
                                    }`} />
                                    <span>Attempt {idx + 1}: {attempt.percentage}%</span>
                                    <Badge variant={attempt.passed ? "default" : "destructive"} className="text-xs">
                                      {attempt.passed ? 'Passed' : 'Failed'}
                                    </Badge>
                                  </div>
                                  <span className="text-gray-500 text-xs">
                                    {new Date(attempt.completedAt || attempt.startedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => handleStartAssessment(module.moduleAssessment!)}
                        >
                          {attempts.length > 0 ? 'Retake Assessment' : 'Take Assessment'}
                        </Button>
                      </div>
                    );
                  })}
                  
                  {/* Final Assessment */}
                  {curriculum.finalAssessment && (
                    <div className="p-4 border rounded-lg border-purple-300 bg-purple-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">Final Course Assessment</span>
                        </div>
                        <Badge className="bg-purple-600">Final</Badge>
                      </div>
                      <p className="text-sm text-purple-700 mb-3">
                        Complete all modules before attempting the final assessment
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-bold">{curriculum.finalAssessment.questions?.length || 0}</div>
                          <div className="text-gray-600">Questions</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-bold">{curriculum.finalAssessment.passingScore}%</div>
                          <div className="text-gray-600">Passing Score</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-bold">
                            {curriculum.finalAssessment.timeLimit || 'No'}
                          </div>
                          <div className="text-gray-600">Time Limit</div>
                        </div>
                      </div>
                      
                      {getPreviousAttempts(curriculum.finalAssessment.id).length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-purple-700 mb-1">
                            Your Best: {Math.max(...getPreviousAttempts(curriculum.finalAssessment.id).map(a => a.percentage))}%
                          </div>
                        </div>
                      )}
                      
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => handleStartAssessment(curriculum.finalAssessment!)}
                      >
                        <Award className="mr-2 h-4 w-4" />
                        {getPreviousAttempts(curriculum.finalAssessment.id).length > 0 
                          ? 'Retake Final Assessment' 
                          : 'Take Final Assessment'}
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <Card className="md:col-span-2 bg-white border-emerald-200">
          <CardContent className="p-0 h-[calc(100vh-200px)] overflow-y-auto">
            {currentAssessment && assessmentAttempt ? (
              <div className="p-6">
                <AssessmentComponent />
              </div>
            ) : selectedLesson ? (
              <LessonContent lesson={selectedLesson} />
            ) : (
              <div className="text-center py-12">
                <PlayCircle className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-emerald-900">Select a lesson to begin</h3>
                <p className="text-emerald-700">Choose a lesson from the sidebar to start learning</p>
                <Button
                  onClick={() => {
                    const firstLesson = allLessons[0];
                    const module = curriculum.modules.find(m => 
                      m.lessons.some(l => l.id === firstLesson?.id)
                    );
                    if (firstLesson && module) {
                      handleLessonSelect(firstLesson.id, module.id);
                    }
                  }}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Start First Lesson
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}