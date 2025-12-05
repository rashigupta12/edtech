/*eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useEffect, useState, useMemo, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, CheckCircle, Clock, Video, FileText, PlayCircle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/auth';

export default function ModulePage() {
  const user = useCurrentUser();
  const userId = user?.id;
  const { courseId, moduleId } = useParams();
  const router = useRouter();

  // -----------------------------
  // State
  // -----------------------------
  const [curriculum, setCurriculum] = useState<any | null>(null);
  const [progress, setProgress] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const res = await fetch(`/api/courses?id=${courseId}&curriculum=true`);
        const data = await res.json();
        setCurriculum(data.data);
      } catch (e) {
        console.error('Error loading curriculum', e);
      } finally {
        setLoading(false);
      }
    }
    loadCurriculum();
  }, [courseId]);

  useEffect(() => {
    if (!userId) return;

    async function loadProgress() {
      try {
        const res = await fetch(`/api/progress?userId=${userId}&courseId=${courseId}`);
        const data = await res.json();
        setProgress(data.data);
      } catch (e) {
        console.error('Error loading progress', e);
      }
    }
    loadProgress();
  }, [userId, courseId]);

  const moduleData = useMemo(() => {
    return curriculum?.modules?.find((m: { id: string | string[] | undefined; }) => m.id === moduleId);
  }, [curriculum, moduleId]);

  // Wrap moduleLessons in useMemo to stabilize its reference
  const moduleLessons = useMemo(() => {
    return moduleData?.lessons || [];
  }, [moduleData]);

  const moduleProgress = useMemo(() => {
    if (!progress?.lessonsProgress || !moduleLessons.length) return 0;
    const completed = moduleLessons.filter((lesson: { id: any; }) =>
      progress.lessonsProgress.some((p: { lessonId: any; isCompleted: any; }) => p.lessonId === lesson.id && p.isCompleted)
    ).length;
    return Math.round((completed / moduleLessons.length) * 100);
  }, [progress, moduleLessons]);

  const getLessonProgress = (lessonId: any) => {
    return progress?.lessonsProgress?.find((p: { lessonId: any; }) => p.lessonId === lessonId);
  };

  // -----------------------------
  // Loading UI
  // -----------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // -----------------------------
  // Module not found
  // -----------------------------
  if (!moduleData) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Module not found</h1>
        <Button onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn`)}>
          Back to Learning
        </Button>
      </div>
    );
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Learning
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline" className="mb-2">Module {moduleData.sortOrder + 1}</Badge>
            <h1 className="text-3xl font-bold">{moduleData.title}</h1>
            {moduleData.description && (
              <p className="text-muted-foreground mt-2">{moduleData.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Module Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Module Progress</p>
                <p className="text-2xl font-bold">{moduleProgress}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Lessons</p>
                <p className="text-2xl font-bold">{moduleLessons.length}</p>
              </div>
            </div>
            <Progress value={moduleProgress} className="h-2" />
            <div className="flex justify-between text-sm">
              <span>
                {moduleLessons.filter((l: { id: any; }) => getLessonProgress(l.id)?.isCompleted).length} of {moduleLessons.length} completed
              </span>
              <span>{moduleProgress}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lessons */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Lessons in this module</h2>
        <div className="space-y-3">
          {moduleLessons.map((lesson: { id: Key | null | undefined; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; contentType: string; description: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; videoDuration: number; }, index: number) => {
            const lp = getLessonProgress(lesson.id);

            return (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Status */}
                      <div className="pt-1">
                        {lp?.isCompleted ? (
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{lesson.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {lesson.contentType === 'VIDEO' && (
                              <span className="flex items-center gap-1">
                                <Video className="h-3 w-3" /> Video
                              </span>
                            )}
                            {lesson.contentType === 'ARTICLE' && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" /> Article
                              </span>
                            )}
                          </Badge>
                        </div>

                        {lesson.description && (
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {lesson.videoDuration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(lesson.videoDuration / 60)} min
                            </span>
                          )}

                          {lp?.isCompleted && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" /> Completed
                            </span>
                          )}

                          {lp?.watchDuration > 0 && !lp?.isCompleted && (
                            <span className="text-blue-600">In progress</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn?lesson=${lesson.id}`)}
                    >
                      {lp?.isCompleted ? 'Review' : lp?.watchDuration ? 'Continue' : 'Start'}
                      <PlayCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
