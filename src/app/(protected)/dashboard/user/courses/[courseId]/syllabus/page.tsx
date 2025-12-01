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
import { CheckCircle, Clock, PlayCircle, ChevronLeft, Award, BookOpen } from 'lucide-react';
import { useCurrentUser } from '@/hooks/auth';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  videoDuration?: number;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

interface Curriculum {
  modules: Module[];
}

interface ProgressData {
  progressPercentage: number;
  completedLessons: number;
  lessonsProgress: Array<{
    lessonId: string;
    isCompleted: boolean;
  }>;
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

  const calculateModuleProgress = (module: Module) => {
    if (!module.lessons.length || !progress) return 0;
    const completed = module.lessons.filter(
      lesson => getLessonProgress(lesson.id)?.isCompleted
    ).length;
    return Math.round((completed / module.lessons.length) * 100);
  };

  const totalLessons = curriculum?.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  ) || 0;

  if (loading) {
    return (
      <div className="p-6 space-y-8">
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
          <h1 className="text-3xl font-bold">Course Syllabus</h1>
          <p className="text-muted-foreground mt-2">
            Complete overview of all modules and lessons
          </p>
        </div>

        <Button onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn`)}>
          <PlayCircle className="mr-2 h-5 w-5" />
          Continue Learning
        </Button>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-sm text-muted-foreground">Modules</span>
              </div>
              <p className="text-3xl font-bold">{curriculum?.modules.length || 0}</p>
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6 text-green-600" />
                <span className="text-sm text-muted-foreground">Lessons</span>
              </div>
              <p className="text-3xl font-bold">{totalLessons}</p>
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-6 w-6 text-blue-600" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <p className="text-3xl font-bold">{progress?.completedLessons || 0}</p>
            </div>

            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-6 w-6 text-orange-600" />
                <span className="text-sm text-muted-foreground">Progress</span>
              </div>
              <p className="text-3xl font-bold">{progress?.progressPercentage || 0}%</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Course Progress</span>
              <span>{progress?.progressPercentage || 0}%</span>
            </div>
            <Progress value={progress?.progressPercentage || 0} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Curriculum Accordion */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Course Curriculum</h2>

        <Accordion type="single" collapsible className="space-y-4">
          {curriculum?.modules.map((module, idx) => {
            const moduleProgress = calculateModuleProgress(module);

            return (
              <Card key={module.id}>
                <AccordionItem value={module.id} className="border-0">
                  <AccordionTrigger className="px-6 py-5 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {idx + 1}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-lg">{module.title}</h3>
                          {module.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {module.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {module.lessons.length} lessons
                        </Badge>
                        <Badge variant={moduleProgress === 100 ? 'default' : 'secondary'}>
                          {moduleProgress}% complete
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 pb-6">
                    {module.description && (
                      <>
                        <p className="text-muted-foreground mb-4">{module.description}</p>
                        <Separator className="mb-6" />
                      </>
                    )}

                    {/* Module Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Module Progress</span>
                        <span>{moduleProgress}%</span>
                      </div>
                      <Progress value={moduleProgress} className="h-2" />
                    </div>

                    {/* Lessons */}
                    <div className="space-y-3">
                      {module.lessons.map((lesson, lessonIdx) => {
                        const isCompleted = getLessonProgress(lesson.id)?.isCompleted;

                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition"
                          >
                            <div className="flex items-center gap-4">
                              {isCompleted ? (
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full border-2 border-border flex items-center justify-center text-sm font-medium">
                                  {lessonIdx + 1}
                                </div>
                              )}

                              <div>
                                <p className="font-medium">{lesson.title}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    {lesson.contentType}
                                  </Badge>
                                  {lesson.videoDuration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {Math.floor(lesson.videoDuration / 60)} min
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/dashboard/user/courses/${courseId}/learn?lesson=${lesson.id}`)
                              }
                            >
                              {isCompleted ? 'Review' : 'Start'}
                              <PlayCircle className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6">
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/user/courses/${courseId}/modules/${module.id}`)}
                      >
                        View Full Module
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            );
          })}
        </Accordion>
      </div>

      {/* Learning Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              "Stay consistent – study a little every day",
              "Take notes while watching videos",
              "Practice what you learn immediately",
              "Join discussions and ask questions",
            ].map((tip, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}