/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import AssessmentStartDialog from "@/components/user/courses/AssessmentStartDialog";
import AssessmentTimer from "@/components/user/courses/AssessmentTimer";
import {
  Assessment,
  AssessmentAttempt,
  Curriculum,
  formatTime,
  formatVideoUrl,
  Lesson,
  LessonProgress,
  safeJson,
  UserAssessmentAttempt,
} from "@/components/user/courses/learn";
import { useCurrentUser } from "@/hooks/auth";
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
  XCircle,
  Menu,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ListChecks,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";

export interface ProgressResponse {
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
  assessmentAttempts?: Record<string, UserAssessmentAttempt[]>;
}

export default function CourseLearnPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?.id ?? null;

  // Data states
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(
    null
  );
  const [assessmentAttempt, setAssessmentAttempt] =
    useState<AssessmentAttempt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProgressLoading, setIsProgressLoading] = useState<boolean>(false);
  const [isAssessmentLoading, setIsAssessmentLoading] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [playerPosition, setPlayerPosition] = useState<number>(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

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
  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);
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
        const res = await fetch(
          `/api/courses?id=${encodeURIComponent(courseId)}&curriculum=true`
        );
        if (!res.ok) throw new Error("Failed to fetch curriculum");
        const json = await safeJson(res);
        if (!mounted) return;

        const modules = json?.data?.modules || [];
        if (modules.length === 0) {
          throw new Error("No curriculum found for this course");
        }

        setCurriculum({
          modules,
          courseTitle: json?.data?.courseTitle || "Untitled Course",
          finalAssessment: json?.data?.finalAssessment || null,
        });

        // Expand first module by default
        if (modules[0]) {
          setExpandedModules(new Set([modules[0].id]));
        }

        const firstLesson = modules?.[0]?.lessons?.[0];
        if (firstLesson) {
          setSelectedLessonId(firstLesson.id);
          setSelectedModuleId(modules[0].id);
        }
      } catch (err) {
        console.error("fetchCurriculum error", err);
        setError(
          err instanceof Error ? err.message : "Failed to load course content"
        );
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
        // Add cache-busting parameter to avoid disk cache
        const timestamp = new Date().getTime();
        const res = await fetch(
          `/api/progress?userId=${encodeURIComponent(
            userId ?? ""
          )}&courseId=${encodeURIComponent(courseId)}&t=${timestamp}`
        );
        if (!res.ok) throw new Error("Failed to fetch progress");
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
        console.error("fetchProgress error", err);
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
      const res = await fetch("/api/assessment-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: selectedAssessment.id,
          userId,
          enrollmentId: progress.enrollmentId,
          status: "IN_PROGRESS",
          startedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to start assessment");

      const responseData = await res.json();

      // Check if the response has the expected structure
      if (!responseData.success) {
        throw new Error(
          responseData.error?.message || "Failed to start assessment"
        );
      }

      // The API returns { success: true, data: { attempt: {...}, questions: [...] } }
      const attemptData = responseData.data?.attempt;

      if (!attemptData || !attemptData.id) {
        throw new Error("Invalid response from server");
      }

      setAssessmentAttempt(attemptData);
      setCurrentAssessment(selectedAssessment);
      setUserAnswers({});
      setAssessmentResults(null);
      setShowResults(false);
      setIsTimerPaused(false);

      // If the API returns answers from a previous attempt, use them
      if (attemptData.answers) {
        setUserAnswers(attemptData.answers);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Start assessment error:", err);
      setError(
        "Failed to start assessment: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setIsAssessmentLoading(false);
      setSelectedAssessment(null);
    }
  };

  // Submit assessment - Use backend calculation only
  const submitAssessment = async () => {
    if (!currentAssessment || !assessmentAttempt || !userId) return;

    setIsAssessmentLoading(true);
    try {
      // Calculate time spent
      const timeSpent = Math.floor(
        (Date.now() - new Date(assessmentAttempt.startedAt).getTime()) / 1000
      );

      console.log("Submitting assessment with ID:", assessmentAttempt.id);

      // Only send answers, let backend calculate score
      const res = await fetch(
        `/api/assessment-attempts?id=${assessmentAttempt.id}&submit=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: userAnswers,
            status: "COMPLETED",
            completedAt: new Date().toISOString(),
            timeSpent: timeSpent,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API error response:", errorText);
        throw new Error(
          `Failed to submit assessment: ${res.status} ${res.statusText}`
        );
      }

      const responseData = await res.json();

      if (!responseData.success) {
        throw new Error(
          responseData.error?.message || "Failed to submit assessment"
        );
      }

      // Use results from backend response
      const backendResults = responseData.data?.results;
      const updatedAttempt = responseData.data?.attempt;

      if (!backendResults || !updatedAttempt) {
        throw new Error("Invalid response from server");
      }

      setAssessmentResults({
        score: backendResults.score,
        totalPoints: backendResults.totalPoints,
        percentage: backendResults.percentage,
        passed: backendResults.passed,
        passingScore:
          backendResults.passingScore || currentAssessment.passingScore,
        correctAnswers: backendResults.correctAnswers,
        totalQuestions: backendResults.totalQuestions,
        attemptId: assessmentAttempt.id,
      });

      // Update the attempt with backend data
      setAssessmentAttempt(updatedAttempt);

      setShowResults(true);

      // Refresh progress data with cache busting
      if (progress?.enrollmentId) {
        try {
          const timestamp = new Date().getTime();
          const progressRes = await fetch(
            `/api/progress?userId=${encodeURIComponent(
              userId
            )}&courseId=${encodeURIComponent(courseId)}&t=${timestamp}`
          );
          if (progressRes.ok) {
            const progressData = await progressRes.json();
            setProgress(progressData.data);
          }
        } catch (progressErr) {
          console.error("Failed to refresh progress:", progressErr);
        }
      }

      if (
        backendResults.passed &&
        selectedLessonId &&
        currentAssessment.assessmentLevel === "LESSON_QUIZ"
      ) {
        await markLessonComplete(selectedLessonId);
      }
    } catch (err) {
      console.error("Submit assessment error:", err);
      setError(
        "Failed to submit assessment: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setIsAssessmentLoading(false);
    }
  };

  // Time up handler
  const handleTimeUp = () => {
    submitAssessment();
  };

  const getPreviousAttempts = (
    assessmentId: string
  ): UserAssessmentAttempt[] => {
    if (!progress?.assessmentAttempts) {
      if (curriculum && assessmentId === curriculum.finalAssessment?.id) {
        return progress?.finalAssessmentStatus?.attempted
          ? [
              {
                id: progress.finalAssessmentStatus.latestAttemptId || "",
                score: progress.finalAssessmentStatus.latestScore || 0,
                percentage: progress.finalAssessmentStatus.latestScore || 0,
                passed: progress.finalAssessmentStatus.passed || false,
                status: "COMPLETED",
                startedAt: new Date().toISOString(),
                timeSpent: 0,
              },
            ]
          : [];
      }

      const moduleAssessment = progress?.moduleAssessmentStatus?.find(
        (m: any) => m.assessmentId === assessmentId
      );
      if (moduleAssessment) {
        return moduleAssessment.attempted
          ? [
              {
                id: moduleAssessment.latestAttemptId || "",
                score: moduleAssessment.latestScore || 0,
                percentage: moduleAssessment.latestScore || 0,
                passed: moduleAssessment.passed || false,
                status: "COMPLETED",
                startedAt: new Date().toISOString(),
                timeSpent: 0,
              },
            ]
          : [];
      }

      return [];
    }

    return progress.assessmentAttempts[assessmentId] || [];
  };

  // Get current assessment progress
  const getAssessmentProgress = () => {
    if (!currentAssessment) return { answered: 0, total: 0, percentage: 0 };

    const answered = Object.keys(userAnswers).filter(
      (key) =>
        userAnswers[key] !== undefined &&
        userAnswers[key] !== "" &&
        userAnswers[key] !== null
    ).length;

    return {
      answered,
      total: currentAssessment.questions.length,
      percentage: Math.round(
        (answered / currentAssessment.questions.length) * 100
      ),
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
        `/api/progress?userId=${encodeURIComponent(
          userId
        )}&lessonId=${encodeURIComponent(lessonId)}&complete=true`,
        { method: "POST" }
      );

      // Refresh progress with cache busting
      const timestamp = new Date().getTime();
      const res = await fetch(
        `/api/progress?userId=${encodeURIComponent(
          userId
        )}&courseId=${encodeURIComponent(courseId)}&t=${timestamp}`
      );
      const json = await safeJson(res);
      setProgress(json?.data ?? null);

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
            updatedProgress.lessonsProgress[lessonIndex].progress.isCompleted =
              true;
            updatedProgress.lessonsProgress[lessonIndex].progress.completedAt =
              new Date().toISOString();
          }
          updatedProgress.lessonsProgress[lessonIndex].isComplete = true;

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
      console.error("markLessonComplete error", err);
    }
  }

  // Send progress update
  async function sendProgressUpdate(lessonId: string, position: number) {
    if (!userId) return;
    try {
      await fetch(
        `/api/progress?userId=${encodeURIComponent(
          userId
        )}&lessonId=${encodeURIComponent(lessonId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastWatchedPosition: Math.floor(position) }),
        }
      );
    } catch (err) {
      console.error("sendProgressUpdate error", err);
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
        sendProgressUpdate(selectedLessonId, latestPositionRef.current).catch(
          () => {}
        );
      }
    };
  }, [selectedLessonId]);

  // Derived data
  const allLessons = curriculum?.modules?.flatMap((m) => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === selectedLessonId);
  const nextLesson =
    currentIndex >= 0 ? allLessons[currentIndex + 1] ?? null : null;
  const prevLesson =
    currentIndex >= 0 ? allLessons[currentIndex - 1] ?? null : null;
  const selectedLesson = allLessons.find((l) => l.id === selectedLessonId);
  const formattedVideoUrl = selectedLesson?.videoUrl
    ? formatVideoUrl(selectedLesson.videoUrl)
    : null;

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-semibold">Error Loading Course</h3>
              </div>
              <p className="text-gray-700 mb-6">{error}</p>
              <Button
                onClick={() =>
                  router.push(`/dashboard/user/courses/${courseId}`)
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Back to Course
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-[600px] bg-gray-200 rounded animate-pulse" />
            <div className="h-[600px] bg-gray-200 rounded animate-pulse md:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  // No curriculum
  if (!curriculum || curriculum.modules.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md border-gray-200 bg-white shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              Course Content Coming Soon
            </h3>
            <p className="text-gray-600 mb-6">
              We're preparing the learning materials for this course.
            </p>
            <Button
              onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
            >
              Return to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Assessment Results Component
  const AssessmentResults = () => {
    if (!assessmentResults || !currentAssessment) return null;

    const canRetake =
      currentAssessment.allowRetake &&
      (currentAssessment.maxAttempts === null ||
        getPreviousAttempts(currentAssessment.id).length <
          (currentAssessment.maxAttempts ?? Infinity));

    return (
      <div className="space-y-6">
        <Card
          className={`border ${
            assessmentResults.passed ? "border-emerald-200" : "border-red-200"
          } bg-white`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    assessmentResults.passed ? "bg-emerald-100" : "bg-red-100"
                  }`}
                >
                  {assessmentResults.passed ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {assessmentResults.passed
                      ? "Assessment Completed Successfully"
                      : "Assessment Not Passed"}
                  </h3>
                  <p className="text-gray-600">
                    {assessmentResults.passed
                      ? "You have demonstrated understanding of the material."
                      : `Minimum passing score: ${assessmentResults.passingScore}%`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-3xl font-bold ${
                    assessmentResults.passed
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {assessmentResults.percentage}%
                </div>
                <div className="text-sm text-gray-500">Your Score</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {assessmentResults.score}
                </div>
                <div className="text-sm text-gray-600">Points Earned</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {assessmentResults.correctAnswers}/
                  {assessmentResults.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {assessmentResults.totalPoints}
                </div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-gray-900">
                  {assessmentAttempt?.timeSpent
                    ? formatTime(assessmentAttempt.timeSpent)
                    : "--:--"}
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {currentAssessment.showCorrectAnswers && (
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <h4 className="font-bold text-lg text-gray-900 mb-4">
                Review Your Answers
              </h4>
              <div className="space-y-4">
                {currentAssessment.questions.map((question, index) => {
                  const userAnswer = userAnswers[question.id];
                  let isCorrect = false;

                  // Calculate correctness based on question type
                  if (question.questionType === "ESSAY") {
                    isCorrect = true; // Essay questions are always marked as correct
                  } else if (question.questionType === "TRUE_FALSE") {
                    // Case-insensitive comparison for TRUE_FALSE
                    const userAnswerNormalized = userAnswer
                      ?.toString()
                      .trim()
                      .toLowerCase();
                    const correctAnswerNormalized = question.correctAnswer
                      .toString()
                      .trim()
                      .toLowerCase();
                    isCorrect =
                      userAnswerNormalized === correctAnswerNormalized;
                  } else if (question.questionType === "SHORT_ANSWER") {
                    // Case-insensitive comparison for SHORT_ANSWER
                    const userAnswerNormalized = userAnswer
                      ?.toString()
                      .trim()
                      .toLowerCase();
                    const correctAnswerNormalized = question.correctAnswer
                      .toString()
                      .trim()
                      .toLowerCase();
                    isCorrect =
                      userAnswerNormalized === correctAnswerNormalized;
                  } else {
                    // For MULTIPLE_CHOICE
                    isCorrect = userAnswer === question.correctAnswer;
                  }

                  return (
                    <div
                      key={question.id}
                      className={`p-4 rounded-lg border ${
                        isCorrect
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-medium text-gray-900">
                              Q{index + 1}
                            </span>
                            <Badge
                              className={
                                question.difficulty === "HARD"
                                  ? "bg-red-100 text-red-800"
                                  : question.difficulty === "MEDIUM"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }
                            >
                              {question.difficulty}
                            </Badge>
                            {question.questionType !== "ESSAY" && (
                              <Badge
                                className={
                                  isCorrect
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {isCorrect ? "Correct" : "Incorrect"}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium mb-3 text-gray-900">
                            {question.questionText}
                          </p>

                          {question.questionType === "MULTIPLE_CHOICE" &&
                            question.options && (
                              <div className="space-y-2 ml-2">
                                {question.options.map(
                                  (option: any, optIndex: number) => (
                                    <div
                                      key={optIndex}
                                      className={`p-3 rounded ${
                                        option === question.correctAnswer
                                          ? "bg-emerald-100 border-emerald-200 border"
                                          : option === userAnswer && !isCorrect
                                          ? "bg-red-100 border-red-200 border"
                                          : "bg-gray-50"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`h-4 w-4 rounded-full border ${
                                            option === question.correctAnswer
                                              ? "bg-emerald-500 border-emerald-500"
                                              : option === userAnswer &&
                                                !isCorrect
                                              ? "bg-red-500 border-red-500"
                                              : "border-gray-300"
                                          }`}
                                        />
                                        <span className="text-gray-900">
                                          {option}
                                        </span>
                                        {option === question.correctAnswer && (
                                          <Badge className="ml-auto bg-emerald-500">
                                            Correct
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                          {question.questionType === "TRUE_FALSE" && (
                            <div className="space-y-2 ml-2">
                              {["True", "False"].map((option) => {
                                const optionNormalized = option.toLowerCase();
                                const correctAnswerNormalized =
                                  question.correctAnswer
                                    ?.toString()
                                    .toLowerCase();
                                const userAnswerNormalized = userAnswer
                                  ?.toString()
                                  .toLowerCase();
                                const isOptionCorrect =
                                  optionNormalized === correctAnswerNormalized;
                                const isUserAnswer =
                                  optionNormalized === userAnswerNormalized;

                                return (
                                  <div
                                    key={option}
                                    className={`p-3 rounded ${
                                      isOptionCorrect
                                        ? "bg-emerald-100 border-emerald-200 border"
                                        : isUserAnswer && !isOptionCorrect
                                        ? "bg-red-100 border-red-200 border"
                                        : "bg-gray-50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`h-4 w-4 rounded-full border ${
                                          isOptionCorrect
                                            ? "bg-emerald-500 border-emerald-500"
                                            : isUserAnswer && !isOptionCorrect
                                            ? "bg-red-500 border-red-500"
                                            : "border-gray-300"
                                        }`}
                                      />
                                      <span className="text-gray-900">
                                        {option}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {(question.questionType === "SHORT_ANSWER" ||
                            question.questionType === "ESSAY") && (
                            <div className="space-y-3 ml-2">
                              {question.questionType === "SHORT_ANSWER" && (
                                <div className="p-3 rounded bg-emerald-50 border-emerald-200 border">
                                  <div className="text-sm font-medium text-emerald-700 mb-1">
                                    Correct Answer:
                                  </div>
                                  <div className="text-gray-900">
                                    {question.correctAnswer}
                                  </div>
                                </div>
                              )}
                              {userAnswer && (
                                <div className="p-3 rounded bg-blue-50 border-blue-200 border">
                                  <div className="text-sm font-medium text-blue-700 mb-1">
                                    Your Answer:
                                  </div>
                                  <div className="whitespace-pre-wrap text-gray-900">
                                    {userAnswer}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {question.explanation && (
                            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                              <div className="text-sm font-medium text-blue-700 mb-1">
                                Explanation
                              </div>
                              <div className="text-sm text-gray-700">
                                {question.explanation}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-gray-900">
                            {question.points} pts
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 pt-2">
          {canRetake && (
            <Button
              onClick={() => {
                setShowResults(false);
                handleStartAssessment(currentAssessment);
              }}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700"
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

              if (
                assessmentResults.passed &&
                selectedLessonId &&
                currentAssessment.assessmentLevel === "LESSON_QUIZ"
              ) {
                const next = nextLesson;
                if (next) {
                  const module = curriculum.modules.find((m) =>
                    m.lessons.some((l) => l.id === next.id)
                  );
                  if (module) {
                    handleLessonSelect(next.id, module.id);
                  }
                }
              }
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
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
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentAssessment.title}
                </h2>
                <p className="text-gray-600 mt-1">
                  {currentAssessment.description}
                </p>
              </div>
              <Badge className="bg-emerald-600">
                {currentAssessment.assessmentLevel.replace("_", " ")}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-emerald-50 p-3 rounded-lg">
                <div className="font-bold text-emerald-700">
                  {currentAssessment.questions.length}
                </div>
                <div className="text-sm text-emerald-600">Questions</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-bold text-blue-700">
                  {currentAssessment.passingScore}%
                </div>
                <div className="text-sm text-blue-600">Passing Score</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <div className="font-bold text-amber-700">
                  {progress.answered}/{progress.total}
                </div>
                <div className="text-sm text-amber-600">Answered</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="font-bold text-purple-700">
                  {currentAssessment.timeLimit
                    ? `${currentAssessment.timeLimit} min`
                    : "No Limit"}
                </div>
                <div className="text-sm text-purple-600">Time Limit</div>
              </div>
            </div>

            {currentAssessment.timeLimit && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <AssessmentTimer
                    timeLimit={currentAssessment.timeLimit}
                    onTimeUp={handleTimeUp}
                    isPaused={isTimerPaused}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTimerPause}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    {isTimerPaused ? (
                      <Eye className="h-4 w-4 mr-2" />
                    ) : (
                      <EyeOff className="h-4 w-4 mr-2" />
                    )}
                    {isTimerPaused ? "Resume Timer" : "Pause Timer"}
                  </Button>
                </div>
                <Progress
                  value={progress.percentage}
                  className="h-2 bg-gray-200"
                />
                <div className="text-sm text-gray-500 text-center">
                  Progress: {progress.answered}/{progress.total} questions (
                  {progress.percentage}%)
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          {currentAssessment.questions.map((question, index) => {
            const userAnswer = userAnswers[question.id];
            const isAnswered =
              userAnswer !== undefined &&
              userAnswer !== "" &&
              userAnswer !== null;

            return (
              <Card
                key={question.id}
                className={`border ${
                  isAnswered ? "border-emerald-200" : "border-gray-200"
                } bg-white`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                          isAnswered
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {question.questionType.replace("_", " ")}
                          </span>
                          <Badge
                            className={
                              question.difficulty === "HARD"
                                ? "bg-red-100 text-red-800"
                                : question.difficulty === "MEDIUM"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {question.difficulty}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {question.points} points{" "}
                          {question.negativePoints > 0 &&
                            `• -${question.negativePoints} if wrong`}
                        </div>
                      </div>
                    </div>
                    {isAnswered && (
                      <Badge className="bg-emerald-100 text-emerald-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Answered
                      </Badge>
                    )}
                  </div>

                  <p className="text-lg font-medium mb-4 text-gray-900">
                    {question.questionText}
                  </p>

                  {/* Question Options */}
                  {question.questionType === "MULTIPLE_CHOICE" &&
                    question.options && (
                      <RadioGroup
                        value={userAnswer || ""}
                        onValueChange={(value) =>
                          setUserAnswers((prev) => ({
                            ...prev,
                            [question.id]: value,
                          }))
                        }
                        className="space-y-2"
                      >
                        {question.options.map(
                          (option: any, optIndex: number) => (
                            <div
                              key={optIndex}
                              className={`flex items-center space-x-3 p-3 rounded-lg border ${
                                userAnswer === option
                                  ? "bg-emerald-50 border-emerald-300"
                                  : "hover:bg-gray-50 border-gray-200"
                              }`}
                            >
                              <RadioGroupItem
                                value={option}
                                id={`${question.id}-${optIndex}`}
                              />
                              <Label
                                htmlFor={`${question.id}-${optIndex}`}
                                className="flex-1 cursor-pointer text-gray-900"
                              >
                                {option}
                              </Label>
                            </div>
                          )
                        )}
                      </RadioGroup>
                    )}

                  {question.questionType === "TRUE_FALSE" && (
                    <RadioGroup
                      value={userAnswer || ""}
                      onValueChange={(value) =>
                        setUserAnswers((prev) => ({
                          ...prev,
                          [question.id]: value.toLowerCase(),
                        }))
                      }
                      className="space-y-2"
                    >
                      {["True", "False"].map((option) => (
                        <div
                          key={option}
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${
                            userAnswer === option.toLowerCase()
                              ? "bg-emerald-50 border-emerald-300"
                              : "hover:bg-gray-50 border-gray-200"
                          }`}
                        >
                          <RadioGroupItem
                            value={option}
                            id={`${question.id}-${option}`}
                          />
                          <Label
                            htmlFor={`${question.id}-${option}`}
                            className="flex-1 cursor-pointer text-gray-900"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.questionType === "SHORT_ANSWER" && (
                    <div className="space-y-2">
                      <Input
                        value={userAnswer || ""}
                        onChange={(e) =>
                          setUserAnswers((prev) => ({
                            ...prev,
                            [question.id]: e.target.value,
                          }))
                        }
                        placeholder="Type your answer here..."
                        className="h-12 border-gray-300 focus:border-emerald-500"
                      />
                      <p className="text-sm text-gray-500">
                        Answers are case-insensitive
                      </p>
                    </div>
                  )}

                  {question.questionType === "ESSAY" && (
                    <div className="space-y-2">
                      <Textarea
                        value={userAnswer || ""}
                        onChange={(e) =>
                          setUserAnswers((prev) => ({
                            ...prev,
                            [question.id]: e.target.value,
                          }))
                        }
                        placeholder="Type your essay answer here..."
                        className="min-h-[150px] border-gray-300 focus:border-emerald-500"
                      />
                      <p className="text-sm text-gray-500">
                        Essay questions will be reviewed manually
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-4">
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {progress.answered} of {progress.total} questions answered
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (confirm("Save progress and exit assessment?")) {
                        setCurrentAssessment(null);
                        setAssessmentAttempt(null);
                      }
                    }}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50"
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Lesson Content Component
  const LessonContent = ({ lesson }: { lesson: Lesson }) => {
    const module = curriculum?.modules.find((m) =>
      m.lessons.some((l) => l.id === lesson.id)
    );
    const lessonProgress = getLessonProgress(lesson.id);
    const lessonQuiz = lesson.quiz;

    return (
      <div className="space-y-6">
        {/* Lesson Header */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {lesson.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    {lesson.contentType === "VIDEO" && (
                      <Video className="h-4 w-4" />
                    )}
                    {lesson.contentType === "ARTICLE" && (
                      <FileText className="h-4 w-4" />
                    )}
                    {lesson.contentType === "QUIZ" && (
                      <Target className="h-4 w-4" />
                    )}
                    <span className="capitalize">
                      {lesson.contentType.toLowerCase()}
                    </span>
                  </div>
                  {lesson.videoDuration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{Math.floor(lesson.videoDuration / 60)} min</span>
                    </div>
                  )}
                  {lessonProgress?.isCompleted && (
                    <Badge className="bg-emerald-100 text-emerald-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {lessonQuiz && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleStartAssessment(lessonQuiz);
                    }}
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Take Quiz
                  </Button>
                )}
                <Button
                  onClick={() => markLessonComplete(lesson.id)}
                  disabled={lessonProgress?.isCompleted}
                  className={`${
                    lessonProgress?.isCompleted
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {lessonProgress?.isCompleted ? "Completed" : "Mark Complete"}
                </Button>
              </div>
            </div>

            {lesson.description && (
              <p className="text-gray-700 mb-2">{lesson.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Lesson Content */}
        {lesson.contentType === "VIDEO" ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {formattedVideoUrl ? (
                  <ReactPlayer
                    url={formattedVideoUrl}
                    width="100%"
                    height="100%"
                    controls
                    playing={false}
                    onProgress={({
                      playedSeconds,
                    }: {
                      playedSeconds: number;
                    }) => {
                      setPlayerPosition(playedSeconds);
                      handleProgressUpdate(playedSeconds);
                    }}
                    onEnded={() => {
                      markLessonComplete(lesson.id);
                    }}
                    onError={(e: any) => {
                      console.error("ReactPlayer error:", e);
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
                          host: "https://www.youtube-nocookie.com",
                        },
                      },
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
            </CardContent>
          </Card>
        ) : lesson.contentType === "ARTICLE" ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="prose prose-sm md:prose-base max-w-none">
                {lesson.articleContent || lesson.description ? (
                  <div className="text-gray-700">
                    {lesson.articleContent ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: lesson.articleContent,
                        }}
                      />
                    ) : (
                      <div className="whitespace-pre-line text-base leading-relaxed">
                        {lesson.description}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                      Article content not available
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : lesson.contentType === "QUIZ" ? (
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="h-8 w-8 text-gray-600" />
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Lesson Quiz
                  </h3>
                  <p className="text-gray-700">
                    Test your understanding of this lesson by taking the quiz.
                  </p>
                </div>
              </div>

              {lessonQuiz ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-bold text-gray-900">
                        {lessonQuiz.questions?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Questions</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-bold text-gray-900">
                        {lessonQuiz.passingScore}%
                      </div>
                      <div className="text-sm text-gray-600">Passing Score</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleStartAssessment(lessonQuiz)}
                    disabled={isAssessmentLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
            </CardContent>
          </Card>
        ) : null}

        {/* Navigation */}
        <Card className="border-gray-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={!prevLesson}
                onClick={() =>
                  prevLesson &&
                  handleLessonSelect(
                    prevLesson.id,
                    curriculum.modules.find((m) =>
                      m.lessons.some((l) => l.id === prevLesson.id)
                    )!.id
                  )
                }
                className="border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous Lesson
              </Button>

              <div className="flex gap-2">
                {selectedModuleId && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/dashboard/user/courses/${courseId}/modules/${selectedModuleId}`
                      )
                    }
                    className="border-gray-300 hover:bg-gray-50 text-gray-700"
                  >
                    Module Overview
                  </Button>
                )}
              </div>

              <Button
                disabled={!nextLesson}
                onClick={() =>
                  nextLesson &&
                  handleLessonSelect(
                    nextLesson.id,
                    curriculum.modules.find((m) =>
                      m.lessons.some((l) => l.id === nextLesson.id)
                    )!.id
                  )
                }
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Next Lesson
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Header */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {curriculum.courseTitle}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="font-semibold text-emerald-700">
                      {progress?.overallProgress ?? 0}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-gray-600">Lessons</span>
                    <span className="font-semibold text-emerald-700">
                      {progress?.completedLessons ?? 0}/
                      {progress?.totalLessons ?? 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="border-gray-300 hover:bg-gray-50 md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/user/courses/${courseId}`)
                  }
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Back to Course
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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

        <div className="grid gap-4 md:grid-cols-3">
          {/* Left Sidebar - Curriculum */}
          <div className={`${sidebarCollapsed ? "hidden" : "block"} md:block`}>
            <Card className="border-gray-200 bg-white h-[calc(100vh-200px)] flex flex-col">
              <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                <Tabs
                  defaultValue="curriculum"
                  className="flex-1 flex flex-col"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-gray-50 p-2">
                    <TabsTrigger
                      value="curriculum"
                      className="data-[state=active]:bg-white data-[state=active]:text-emerald-700"
                    >
                      Curriculum
                    </TabsTrigger>
                    <TabsTrigger
                      value="assessments"
                      className="data-[state=active]:bg-white data-[state=active]:text-emerald-700"
                    >
                      Assessments
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="curriculum"
                    className="flex-1 overflow-auto p-4"
                  >
                    <div className="space-y-4">
                      {curriculum.modules.map((module) => {
                        const isExpanded = expandedModules.has(module.id);
                        const moduleAttempts = module.moduleAssessment
                          ? getPreviousAttempts(module.moduleAssessment.id)
                          : [];
                        const hasPassedModuleAssessment = moduleAttempts.some(
                          (attempt) => attempt.passed
                        );

                        return (
                          <div key={module.id} className="space-y-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-between hover:bg-gray-50 p-3"
                              onClick={() => toggleModule(module.id)}
                            >
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronUp className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="font-medium text-gray-900">
                                  {module.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {module.moduleAssessment && (
                                  <Badge
                                    className={`${
                                      hasPassedModuleAssessment
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {hasPassedModuleAssessment ? "✓" : "Q"}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {module.lessons.length}
                                </Badge>
                              </div>
                            </Button>

                            {isExpanded && (
                              <div className="space-y-1 ml-4">
                                {module.lessons.map((lesson) => {
                                  const lessonProgress = getLessonProgress(
                                    lesson.id
                                  );
                                  const isActive =
                                    lesson.id === selectedLessonId;
                                  const lessonAttempts = lesson.quiz
                                    ? getPreviousAttempts(lesson.quiz.id)
                                    : [];

                                  return (
                                    <Button
                                      key={lesson.id}
                                      variant={isActive ? "secondary" : "ghost"}
                                      className={`w-full justify-start font-normal p-2 ${
                                        isActive
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "hover:bg-gray-50 text-gray-800"
                                      }`}
                                      onClick={() =>
                                        handleLessonSelect(lesson.id, module.id)
                                      }
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        {lessonProgress?.isCompleted ? (
                                          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                        ) : (
                                          <div className="h-4 w-4 rounded-full border border-gray-300 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 text-left truncate">
                                          <div className="flex items-center gap-2">
                                            {lesson.contentType === "VIDEO" && (
                                              <Video className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                            )}
                                            {lesson.contentType ===
                                              "ARTICLE" && (
                                              <FileText className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                            )}
                                            {lesson.contentType === "QUIZ" && (
                                              <Target className="h-3 w-3 text-gray-500 flex-shrink-0" />
                                            )}
                                            <span className="truncate">
                                              {lesson.title}
                                            </span>
                                          </div>
                                        </div>
                                        {lessonAttempts.length > 0 && (
                                          <Badge className="bg-gray-100 text-gray-800 text-xs">
                                            {lessonAttempts.length}
                                          </Badge>
                                        )}
                                      </div>
                                    </Button>
                                  );
                                })}

                                {/* Module Assessment */}
                                {module.moduleAssessment && (
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start mt-2 p-2 border-dashed"
                                    onClick={() =>
                                      handleStartAssessment(
                                        module.moduleAssessment!
                                      )
                                    }
                                  >
                                    <Target className="h-4 w-4 mr-2 text-emerald-600" />
                                    <span className="text-sm">
                                      Module Assessment
                                    </span>
                                    {moduleAttempts.length > 0 && (
                                      <Badge className="ml-auto bg-emerald-100 text-emerald-800 text-xs">
                                        {moduleAttempts.length}
                                      </Badge>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Final Assessment */}
                      {curriculum.finalAssessment && (
                        <div className="mt-4 pt-4 border-t">
                          <Button
                            variant="outline"
                            className="w-full justify-start p-6 border-emerald-200 hover:bg-emerald-50"
                            onClick={() =>
                              handleStartAssessment(curriculum.finalAssessment!)
                            }
                          >
                            <Award className="h-5 w-5 mr-2 text-emerald-600" />
                            <div className="text-left">
                              <div className="font-medium text-emerald-700">
                                Final Assessment
                              </div>
                              <div className="text-xs text-gray-600">
                                {getPreviousAttempts(
                                  curriculum.finalAssessment.id
                                ).length > 0
                                  ? `${
                                      getPreviousAttempts(
                                        curriculum.finalAssessment.id
                                      ).length
                                    } attempt(s)`
                                  : "Complete all modules first"}
                              </div>
                            </div>
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="assessments"
                    className="flex-1 overflow-auto p-4"
                  >
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900">
                        Assessment Overview
                      </h3>

                      {/* Module Assessments */}
                      {curriculum.modules
                        .filter((m) => m.moduleAssessment)
                        .map((module) => {
                          const attempts = getPreviousAttempts(
                            module.moduleAssessment!.id
                          );
                          const bestScore =
                            attempts.length > 0
                              ? Math.max(...attempts.map((a) => a.percentage))
                              : null;

                          return (
                            <div
                              key={module.id}
                              className="p-3 border border-gray-200 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-gray-600" />
                                  <span className="font-medium text-gray-900">
                                    {module.title}
                                  </span>
                                </div>
                                {bestScore && (
                                  <Badge
                                    className={
                                      bestScore >=
                                      module.moduleAssessment!.passingScore
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {bestScore}%
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  {attempts.length} attempt(s)
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleStartAssessment(
                                      module.moduleAssessment!
                                    )
                                  }
                                  className="text-emerald-600 hover:text-emerald-700"
                                >
                                  {attempts.length > 0 ? "Retake" : "Start"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}

                      {/* Final Assessment */}
                      {curriculum.finalAssessment && (
                        <div className="p-4 border border-emerald-200 rounded-lg bg-emerald-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Award className="h-5 w-5 text-emerald-600" />
                              <span className="font-medium text-emerald-700">
                                Final Assessment
                              </span>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800">
                              Final
                            </Badge>
                          </div>
                          <p className="text-sm text-emerald-600 mb-3">
                            Complete all modules to unlock
                          </p>
                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() =>
                              handleStartAssessment(curriculum.finalAssessment!)
                            }
                          >
                            <Award className="mr-2 h-4 w-4" />
                            {getPreviousAttempts(curriculum.finalAssessment.id)
                              .length > 0
                              ? "Retake Final"
                              : "Take Final"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2">
            <Card className="border-gray-200 bg-white h-[calc(100vh-200px)]">
              <CardContent className="p-4 h-full overflow-auto">
                {currentAssessment && assessmentAttempt ? (
                  <AssessmentComponent />
                ) : selectedLesson ? (
                  <LessonContent lesson={selectedLesson} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                      <PlayCircle className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      Ready to Learn?
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      Select a lesson from the curriculum to start your learning
                      journey.
                    </p>
                    <Button
                      onClick={() => {
                        const firstLesson = allLessons[0];
                        const module = curriculum.modules.find((m) =>
                          m.lessons.some((l) => l.id === firstLesson?.id)
                        );
                        if (firstLesson && module) {
                          handleLessonSelect(firstLesson.id, module.id);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Start First Lesson
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
