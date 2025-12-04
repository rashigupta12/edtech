/*eslint-disable  @typescript-eslint/no-explicit-any*/
/*eslint-disable   @typescript-eslint/no-unused-vars*/
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Assessment,
  Curriculum,
  Lesson,
  LessonProgress,
  ProgressResponse,
} from "@/components/user/courses/learn";

import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Target,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface LessonContentProps {
  lesson: Lesson;
  curriculum: Curriculum;
  progress: ProgressResponse | null;
  courseId: string;
  userId: string | null;
  onLessonSelect: (lessonId: string, moduleId: string) => void;
  onStartAssessment: (assessment: Assessment) => void;
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  selectedModuleId: string | null;
}

export default function LessonContent({
  lesson,
  curriculum,
  progress,
  courseId,
  userId,
  onLessonSelect,
  onStartAssessment,
  prevLesson,
  nextLesson,
  selectedModuleId,
}: LessonContentProps) {
  const router = useRouter();
  const [playerPosition, setPlayerPosition] = useState<number>(0);
  const progressTimeoutRef = useRef<number | null>(null);
  const latestPositionRef = useRef<number>(0);
  const lessonQuiz = lesson.quiz;

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

  const lessonProgress = getLessonProgress(lesson.id);

  useEffect(() => {
    if (lessonProgress) {
      setPlayerPosition(lessonProgress.lastWatchedPosition ?? 0);
    }
  }, [lessonProgress]);

  // Get video player URL
  const getVideoPlayerUrl = (videoUrl: string | null): string | null => {
    if (!videoUrl) return null;

    // YouTube URLs
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      let videoId = "";

      if (videoUrl.includes("youtu.be/")) {
        videoId = videoUrl.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (videoUrl.includes("youtube.com/watch")) {
        const url = new URL(videoUrl);
        videoId = url.searchParams.get("v") || "";
      } else if (videoUrl.includes("youtube.com/embed/")) {
        return `${videoUrl}${videoUrl.includes("?") ? "&" : "?"}autoplay=0`;
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
      }
    }

    // Vimeo URLs
    if (videoUrl.includes("vimeo.com")) {
      const videoId = videoUrl.split("vimeo.com/")[1]?.split("?")[0] || "";
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0`;
      }
    }

    // Direct video files
    if (
      videoUrl.endsWith(".mp4") ||
      videoUrl.endsWith(".webm") ||
      videoUrl.endsWith(".ogg") ||
      videoUrl.includes(".mp4?") ||
      videoUrl.includes(".webm?")
    ) {
      return videoUrl;
    }

    // AWS S3 URLs or other cloud storage
    if (
      videoUrl.includes("amazonaws.com") ||
      videoUrl.includes("storage.googleapis.com") ||
      videoUrl.includes("blob.core.windows.net")
    ) {
      const isLikelyVideo = /\.(mp4|webm|ogg|mov|avi|wmv|mkv|flv)(\?.*)?$/i.test(
        videoUrl
      );
      if (isLikelyVideo) {
        return videoUrl;
      }
    }

    return videoUrl;
  };

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
      sendProgressUpdate(lesson.id, latestPositionRef.current);
      progressTimeoutRef.current = null;
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (progressTimeoutRef.current) {
        sendProgressUpdate(lesson.id, latestPositionRef.current).catch(
          () => {}
        );
      }
    };
  }, [lesson.id]);

  async function markLessonComplete(lessonId: string) {
    if (!userId) return;
    try {
      await fetch(
        `/api/progress?userId=${encodeURIComponent(
          userId
        )}&lessonId=${encodeURIComponent(lessonId)}&complete=true`,
        { method: "POST" }
      );

      // Refresh would be handled by parent component
      router.refresh();
    } catch (err) {
      console.error("markLessonComplete error", err);
    }
  }

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
                    onStartAssessment(lessonQuiz);
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
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Video className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      Video Lesson
                    </h3>
                    {lesson.videoDuration && (
                      <p className="text-sm text-gray-600">
                        Duration: {Math.floor(lesson.videoDuration / 60)}:
                        {String(lesson.videoDuration % 60).padStart(2, "0")}
                      </p>
                    )}
                  </div>
                </div>
                <a
                  href={lesson.videoUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  <Eye className="h-4 w-4" />
                  Open in new tab
                </a>
              </div>

              {lesson.videoUrl ? (
                <>
                  {/* Video Player */}
                  <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-300">
                    {(() => {
                      const embedUrl = getVideoPlayerUrl(lesson.videoUrl);

                      // For direct video files
                      if (
                        embedUrl &&
                        (embedUrl.includes(".mp4") ||
                          embedUrl.includes(".webm") ||
                          embedUrl.includes("amazonaws.com"))
                      ) {
                        return (
                          <video
                            key={embedUrl}
                            className="w-full h-full"
                            controls
                            controlsList="nodownload"
                            disablePictureInPicture
                            onContextMenu={(e) => e.preventDefault()}
                            preload="metadata"
                            onTimeUpdate={(e) =>
                              handleProgressUpdate(e.currentTarget.currentTime)
                            }
                          >
                            <source src={embedUrl} type="video/mp4" />
                            <source src={embedUrl} type="video/webm" />
                            Your browser does not support the video tag.
                          </video>
                        );
                      }

                      // For YouTube, Vimeo
                      if (embedUrl) {
                        return (
                          <iframe
                            src={`${embedUrl}${
                              embedUrl.includes("?") ? "&" : "?"
                            }autoplay=0`}
                            className="w-full h-full"
                            title={lesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        );
                      }

                      return (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                          <Video className="h-16 w-16 text-gray-400 mb-4" />
                          <p className="text-gray-600 mb-4">
                            Video cannot be embedded
                          </p>
                          <a
                            href={lesson.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Open Video
                          </a>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Video Info Section */}
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {(() => {
                          const url = lesson.videoUrl.toLowerCase();
                          if (url.includes("youtube")) return "YouTube";
                          if (url.includes("vimeo")) return "Vimeo";
                          if (url.includes("amazonaws.com")) return "AWS S3";
                          if (url.includes(".mp4")) return "MP4 Video";
                          return "Video Content";
                        })()}
                      </Badge>
                      {lesson.videoDuration && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          {Math.floor(lesson.videoDuration / 60)}:
                          {String(lesson.videoDuration % 60).padStart(2, "0")}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium">
                    Video not available
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    The video content for this lesson is currently unavailable.
                  </p>
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
                  <p className="text-gray-600">Article content not available</p>
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
                <h3 className="font-bold text-lg text-gray-900">Lesson Quiz</h3>
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
                  onClick={() => onStartAssessment(lessonQuiz)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Target className="mr-2 h-5 w-5" />
                  Start Quiz
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
                onLessonSelect(
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
                onLessonSelect(
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
}