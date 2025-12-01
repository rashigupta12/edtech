/*eslint-disable @typescript-eslint/no-explicit-any */
/*eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactPlayer from 'react-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlayCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Video,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';

// --- Types ---
type ContentType = 'VIDEO' | 'ARTICLE' | 'QUIZ';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  contentType: ContentType;
  videoUrl?: string | null;
  articleContent?: string | null;
  videoDuration?: number | null; // seconds
  sortOrder: number;
  isFree?: boolean;
}

interface CurriculumModule {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  lessons: Lesson[];
}

interface Curriculum {
  modules: CurriculumModule[];
  courseTitle?: string;
}

interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  isCompleted: boolean;
  completedAt: string | null;
  lastWatchedPosition: number; // seconds
  watchDuration: number; // seconds
}

interface ProgressResponse {
  progressPercentage: number;
  lessonsProgress: LessonProgress[];
}

// --- Helper utilities ---
const safeJson = async (res: Response) => {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
};

// Format video URL to ensure it's valid
const formatVideoUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // Clean up the URL
  let cleanUrl = url.trim();
  
  // Fix "youtube .com" -> "https://youtube.com"
  if (cleanUrl.toLowerCase() === 'youtube .com') {
    return 'https://youtube.com';
  }
  
  // Add https:// if missing
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  
  return cleanUrl;
};

// --- Component ---
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
  const [playerPosition, setPlayerPosition] = useState<number>(0);

  // refs for debounced progress updates
  const progressTimeoutRef = useRef<number | null>(null);
  const latestPositionRef = useRef<number>(0);

  // Fetch curriculum once courseId changes
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
        
        // Extract modules from the nested data property
        const modules = json?.data?.modules || [];
        if (modules.length === 0) {
          throw new Error('No curriculum found for this course');
        }
        
        setCurriculum({
          modules,
          courseTitle: json?.data?.courseTitle || 'Untitled Course'
        });

        // auto-select first lesson if present
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

  // Fetch progress when userId or courseId change
  useEffect(() => {
    let mounted = true;
    if (!userId) return;

    async function fetchProgress() {
      setIsProgressLoading(true);
      try {
        const res = await fetch(`/api/progress?userId=${encodeURIComponent(userId ?? "")}&courseId=${encodeURIComponent(courseId ?? "")}`);
        if (!res.ok) throw new Error('Failed to fetch progress');
        const json = await safeJson(res);
        if (!mounted) return;
        setProgress(json?.data ?? null);

        // if there's a saved last watched position for the selected lesson, restore it
        if (selectedLessonId) {
          const lp = json?.data?.lessonsProgress?.find((x: LessonProgress) => x.lessonId === selectedLessonId);
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

  // Derived data helpers
  const allLessons = curriculum?.modules?.flatMap((m) => m.lessons) ?? [];
  const currentIndex = allLessons.findIndex((l) => l.id === selectedLessonId);
  const nextLesson = currentIndex >= 0 ? allLessons[currentIndex + 1] ?? null : null;
  const prevLesson = currentIndex >= 0 ? allLessons[currentIndex - 1] ?? null : null;

  const getLessonProgress = (lessonId: string): LessonProgress | undefined =>
    progress?.lessonsProgress?.find((lp) => lp.lessonId === lessonId);

  // Handlers
  const handleLessonSelect = (lessonId: string, moduleId: string) => {
    setSelectedLessonId(lessonId);
    setSelectedModuleId(moduleId);
    setPlayerPosition(0);
    // Scroll to top when selecting new lesson
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function markLessonComplete(lessonId: string) {
    if (!userId) return;
    try {
      await fetch(`/api/progress?userId=${encodeURIComponent(userId)}&lessonId=${encodeURIComponent(lessonId)}&complete=true`, {
        method: 'POST',
      });

      // refresh progress
      const res = await fetch(`/api/progress?userId=${encodeURIComponent(userId)}&courseId=${encodeURIComponent(courseId)}`);
      const json = await safeJson(res);
      setProgress(json?.data ?? null);
    } catch (err) {
      console.error('markLessonComplete error', err);
    }
  }

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

  // Debounced progress updater to avoid flooding the server while video plays
  const handleProgressUpdate = (positionSec: number) => {
    latestPositionRef.current = positionSec;

    // clear previous timeout
    if (progressTimeoutRef.current) {
      window.clearTimeout(progressTimeoutRef.current);
    }

    // schedule a save after 2s of inactivity
    progressTimeoutRef.current = window.setTimeout(() => {
      if (selectedLessonId) {
        sendProgressUpdate(selectedLessonId, latestPositionRef.current);
      }
      progressTimeoutRef.current = null;
    }, 2000);
  };

  // cleanup on unmount: flush last progress
  useEffect(() => {
    return () => {
      if (progressTimeoutRef.current && selectedLessonId) {
        // flush last position synchronously (best-effort)
        sendProgressUpdate(selectedLessonId, latestPositionRef.current).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLesson: Lesson | undefined = allLessons.find((l) => l.id === selectedLessonId);
  const formattedVideoUrl = selectedLesson?.videoUrl ? formatVideoUrl(selectedLesson.videoUrl) : null;

  // UI: Error state
  if (error) {
    return (
      <div className="space-y-6  min-h-screen p-6">
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

  // UI: loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6  min-h-screen p-6">
        <Skeleton className="h-12 w-64 " />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[600px] " />
          <Skeleton className="h-[600px] md:col-span-2 " />
        </div>
      </div>
    );
  }

  // UI: No curriculum
  if (!curriculum || curriculum.modules.length === 0) {
    return (
      <div className="text-center py-12  min-h-screen">
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

  return (
    <div className="space-y-6 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">Learning Interface</h1>
          <p className="text-emerald-700 mt-2">
            {curriculum.courseTitle} • Progress: {progress?.progressPercentage ?? 0}%
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
          <span>{progress?.progressPercentage ?? 0}%</span>
        </div>
        <Progress value={progress?.progressPercentage ?? 0} className="h-2" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Sidebar - Curriculum */}
        <Card className="md:col-span-1 bg-white border-emerald-200">
          <CardContent className="p-0">
            <Tabs defaultValue="curriculum" className="h-full">
              <TabsList className="grid w-full grid-cols-2 bg-emerald-50">
                <TabsTrigger value="curriculum" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900">
                  Curriculum
                </TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900">
                  Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="curriculum" className="p-4 h-[calc(100vh-200px)] overflow-y-auto">
                <div className="space-y-4">
                  {curriculum.modules.map((module) => (
                    <div key={module.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-emerald-900">{module.title}</h3>
                        <Badge variant="outline" className="border-emerald-600 text-emerald-700 bg-emerald-50">
                          {module.lessons.length} lessons
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        {module.lessons.map((lesson) => {
                          const lessonProgress = getLessonProgress(lesson.id);
                          const isActive = lesson.id === selectedLessonId;

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
                                    <span className="truncate font-medium">{lesson.title}</span>
                                  </div>

                                  {lesson.description && (
                                    <p className="text-xs text-emerald-700 mt-1 line-clamp-2">{lesson.description}</p>
                                  )}

                                  {lesson.contentType === 'VIDEO' && lesson.videoDuration && (
                                    <span className="text-xs text-emerald-700 flex items-center gap-1 mt-1">
                                      <Clock className="h-3 w-3" />
                                      {Math.floor(lesson.videoDuration / 60)} min
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="p-4">
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                  <h3 className="font-semibold mb-2 text-emerald-900">Notes feature coming soon</h3>
                  <p className="text-sm text-emerald-700">Take notes while you learn</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <Card className="md:col-span-2 bg-white border-emerald-200">
          <CardContent className="p-0 h-[calc(100vh-200px)] overflow-y-auto">
            {selectedLesson ? (
              <div className="space-y-6 p-6">
                {/* Lesson Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-emerald-900">{selectedLesson.title}</h2>
                    <Button
                      variant={getLessonProgress(selectedLesson.id)?.isCompleted ? 'secondary' : 'outline'}
                      onClick={() => markLessonComplete(selectedLesson.id)}
                      disabled={getLessonProgress(selectedLesson.id)?.isCompleted}
                      size="sm"
                      className={
                        getLessonProgress(selectedLesson.id)?.isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-white border-emerald-300 hover:bg-emerald-50 text-emerald-900'
                      }
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {getLessonProgress(selectedLesson.id)?.isCompleted ? 'Completed' : 'Mark Complete'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-emerald-700">
                    <div className="flex items-center gap-1">
                      {selectedLesson.contentType === 'VIDEO' && <Video className="h-4 w-4" />}
                      {selectedLesson.contentType === 'ARTICLE' && <FileText className="h-4 w-4" />}
                      <span className="capitalize">{selectedLesson.contentType.toLowerCase()}</span>
                    </div>
                    {selectedLesson.videoDuration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{Math.floor(selectedLesson.videoDuration / 60)} min</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedLesson.description && selectedLesson.contentType !== 'ARTICLE' && (
                    <p className="text-emerald-700 mt-2">{selectedLesson.description}</p>
                  )}
                </div>

                <Separator className="bg-emerald-200" />

                {/* Lesson Content */}
                {selectedLesson.contentType === 'VIDEO' ? (
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
                            // mark complete when video ends
                            markLessonComplete(selectedLesson.id);
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
                ) : selectedLesson.contentType === 'ARTICLE' ? (
                  <div className="space-y-4">
                    <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none prose-emerald">
                      {(selectedLesson.articleContent || selectedLesson.description) ? (
                        <div className="p-6 bg-emerald-50 rounded-lg">
                          {selectedLesson.articleContent ? (
                            <div dangerouslySetInnerHTML={{ __html: selectedLesson.articleContent }} />
                          ) : (
                            <div className="whitespace-pre-line text-base leading-relaxed text-emerald-900">
                              {selectedLesson.description}
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
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                    <p className="text-emerald-700">Quiz feature coming soon</p>
                  </div>
                )}

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
            ) : (
              <div className="text-center py-12">
                <PlayCircle className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-emerald-900">Select a lesson to begin</h3>
                <p className="text-emerald-700">Choose a lesson from the sidebar to start learning</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}