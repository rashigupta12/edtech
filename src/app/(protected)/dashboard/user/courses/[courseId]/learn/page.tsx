/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssessmentStartDialog from "@/components/user/courses/AssessmentStartDialog";
import {
  Assessment,
  Curriculum,
  ProgressResponse,
  safeJson,
  UserAssessmentAttempt,
} from "@/components/user/courses/learn";
import LessonContent from "@/components/user/courses/LessonContent";
import { useCurrentUser } from "@/hooks/auth";
import {
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  ListChecks,
  Menu,
  PlayCircle,
  Target,
  Video,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";

export default function CourseLearnPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?.id ?? null;

  // Data states
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProgressLoading, setIsProgressLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  // Assessment state
  const [showStartDialog, setShowStartDialog] = useState<boolean>(false);
  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);

  // Refs for preserving scroll position
  const curriculumTabRef = useRef<HTMLDivElement>(null);

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

  // Fetch progress - wrapped in useCallback to prevent infinite loops
  const fetchProgress = useCallback(async () => {
    if (!userId || !courseId) return;

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

      setProgress(json?.data ?? null);
    } catch (err) {
      console.error("fetchProgress error", err);
    } finally {
      setIsProgressLoading(false);
    }
  }, [userId, courseId]);

  // Initial progress fetch
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Preserve expanded modules when progress updates
  useEffect(() => {
    if (curriculum && selectedModuleId) {
      // Ensure the current module stays expanded
      setExpandedModules(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedModuleId);
        return newSet;
      });
    }
  }, [selectedModuleId, curriculum]);

  // Start assessment - Navigate to assessment page
  const handleStartAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowStartDialog(true);
  };

  const confirmStartAssessment = async () => {
    if (!selectedAssessment || !userId || !progress?.enrollmentId) return;

    setShowStartDialog(false);

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

      if (!responseData.success) {
        throw new Error(
          responseData.error?.message || "Failed to start assessment"
        );
      }

      const attemptData = responseData.data?.attempt;

      if (!attemptData || !attemptData.id) {
        throw new Error("Invalid response from server");
      }

      // Navigate to assessment page with attempt ID
      router.push(
        `/dashboard/user/courses/${courseId}/assessments/${selectedAssessment.id}?attemptId=${attemptData.id}`
      );
    } catch (err) {
      console.error("Start assessment error:", err);
      setError(
        "Failed to start assessment: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setSelectedAssessment(null);
    }
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

  // Lesson selection handler
  const handleLessonSelect = (lessonId: string, moduleId: string) => {
    setSelectedLessonId(lessonId);
    setSelectedModuleId(moduleId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler for when a lesson is marked complete
  const handleLessonCompleted = () => {
    // Refresh progress data
    fetchProgress();
    
    // Keep the current module expanded
    if (selectedModuleId) {
      setExpandedModules(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedModuleId);
        return newSet;
      });
    }
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
              We &apos;re preparing the learning materials for this course.
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

  const allLessons = curriculum?.modules?.flatMap((m) => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === selectedLessonId);
  const nextLesson =
    currentIndex >= 0 ? allLessons[currentIndex + 1] ?? null : null;
  const prevLesson =
    currentIndex >= 0 ? allLessons[currentIndex - 1] ?? null : null;
  const selectedLesson = allLessons.find((l) => l.id === selectedLessonId);

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
            isLoading={false}
          />
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
                    ref={curriculumTabRef}
                  >
                    <div className="space-y-4">
                      {curriculum.modules.map((mod) => {
                        const isExpanded = expandedModules.has(mod.id);
                        const moduleAttempts = mod.moduleAssessment
                          ? getPreviousAttempts(mod.moduleAssessment.id)
                          : [];
                        const hasPassedModuleAssessment = moduleAttempts.some(
                          (attempt) => attempt.passed
                        );

                        return (
                          <div key={mod.id} className="space-y-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-between hover:bg-gray-50 p-3"
                              onClick={() => toggleModule(mod.id)}
                            >
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronUp className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="font-medium text-gray-900">
                                  {mod.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {mod.moduleAssessment && (
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
                                  {mod.lessons.length}
                                </Badge>
                              </div>
                            </Button>

                            {isExpanded && (
                              <div className="space-y-1 ml-4">
                                {mod.lessons.map((lesson) => {
                                  const lessonAttempts = lesson.quiz
                                    ? getPreviousAttempts(lesson.quiz.id)
                                    : [];

                                  return (
                                    <Button
                                      key={lesson.id}
                                      variant={
                                        lesson.id === selectedLessonId
                                          ? "secondary"
                                          : "ghost"
                                      }
                                      className={`w-full justify-start font-normal p-2 ${
                                        lesson.id === selectedLessonId
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "hover:bg-gray-50 text-gray-800"
                                      }`}
                                      onClick={() =>
                                        handleLessonSelect(lesson.id, mod.id)
                                      }
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        <div className="h-4 w-4 flex-shrink-0">
                                          {lesson.contentType === "VIDEO" && (
                                            <Video className="h-3 w-3 text-gray-500" />
                                          )}
                                          {lesson.contentType === "ARTICLE" && (
                                            <FileText className="h-3 w-3 text-gray-500" />
                                          )}
                                          {lesson.contentType === "QUIZ" && (
                                            <Target className="h-3 w-3 text-gray-500" />
                                          )}
                                        </div>
                                        <div className="flex-1 text-left truncate">
                                          <span className="truncate">
                                            {lesson.title}
                                          </span>
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
                                {mod.moduleAssessment && (
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start mt-2 p-2 border-dashed"
                                    onClick={() =>
                                      handleStartAssessment(
                                        mod.moduleAssessment!
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
                {selectedLesson ? (
                  <LessonContent
                    lesson={selectedLesson}
                    curriculum={curriculum}
                    progress={progress}
                    courseId={courseId}
                    userId={userId}
                    onLessonSelect={handleLessonSelect}
                    onStartAssessment={handleStartAssessment}
                    onLessonCompleted={handleLessonCompleted} // Added this prop
                    prevLesson={prevLesson}
                    nextLesson={nextLesson}
                    selectedModuleId={selectedModuleId}
                  />
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
                        const mod = curriculum.modules.find((m) =>
                          m.lessons.some((l) => l.id === firstLesson?.id)
                        );
                        if (firstLesson && mod) {
                          handleLessonSelect(firstLesson.id, mod.id);
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