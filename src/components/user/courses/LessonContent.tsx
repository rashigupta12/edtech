/*eslint-disable  @typescript-eslint/no-explicit-any*/
/*eslint-disable   @typescript-eslint/no-unused-vars*/
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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
  Lock,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface LessonContentProps {
  lesson: Lesson;
  curriculum: Curriculum;
  progress: ProgressResponse | null;
  courseId: string;
  userId: string | null;
  onLessonSelect: (lessonId: string, moduleId: string) => void;
  onStartAssessment: (assessment: Assessment) => void;
  onLessonCompleted?: () => void;
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
  onLessonCompleted,
  prevLesson,
  nextLesson,
  selectedModuleId,
}: LessonContentProps) {
  const router = useRouter();
  const [playerPosition, setPlayerPosition] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoWatchPercentage, setVideoWatchPercentage] = useState<number>(0);
  const [isMarkingComplete, setIsMarkingComplete] = useState<boolean>(false);
  const [canMarkComplete, setCanMarkComplete] = useState<boolean>(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const progressTimeoutRef = useRef<number | null>(null);
  const latestPositionRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
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
  const completionRules = lesson.completionRules;
  const requireVideoWatched = completionRules?.requireVideoWatched || false;
  const minVideoWatchPercentage = completionRules?.minVideoWatchPercentage || 90;

  // Check if video is YouTube/Vimeo - FIXED: Handle null/undefined
  const isExternalVideo = (url: string | null | undefined): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.includes('vimeo.com');
  };

  const isYouTubeOrVimeo = isExternalVideo(lesson.videoUrl);

  useEffect(() => {
    if (lessonProgress) {
      setPlayerPosition(lessonProgress.lastWatchedPosition ?? 0);
      setVideoWatchPercentage(lessonProgress.overallProgress || 0);
    }
  }, [lessonProgress]);

  // Check if lesson can be marked complete based on completion rules
  useEffect(() => {
    if (lessonProgress?.isCompleted) {
      setCanMarkComplete(false); // Already completed
      return;
    }

    if (lesson.contentType === "VIDEO" && requireVideoWatched) {
      if (isYouTubeOrVimeo) {
        // For YouTube/Vimeo videos, allow marking complete immediately
        // (since we can't track progress properly)
        setCanMarkComplete(true);
      } else {
        // For HTML5 videos, check watch percentage
        const hasMetRequirement = videoWatchPercentage >= minVideoWatchPercentage;
        setCanMarkComplete(hasMetRequirement);
      }
    } else if (lesson.contentType === "ARTICLE") {
      // For articles, they can be marked complete immediately
      // (unless there are other requirements like resources viewed)
      const requireResourcesViewed = completionRules?.requireResourcesViewed || false;
      if (requireResourcesViewed) {
        // You can implement resource viewing check here
        setCanMarkComplete(true); // Placeholder
      } else {
        setCanMarkComplete(true);
      }
    } else if (lesson.contentType === "QUIZ") {
      // For quizzes, they can be marked complete after passing
      const requireQuizPassed = completionRules?.requireQuizPassed || false;
      if (requireQuizPassed) {
        // Check if quiz has been passed
        // You'll need to implement this based on your data structure
        setCanMarkComplete(true); // Placeholder - update based on actual logic
      } else {
        setCanMarkComplete(true);
      }
    } else {
      setCanMarkComplete(true);
    }
  }, [
    lesson.contentType,
    lesson.videoUrl,
    lessonProgress?.isCompleted,
    videoWatchPercentage,
    requireVideoWatched,
    minVideoWatchPercentage,
    completionRules,
    isYouTubeOrVimeo,
  ]);

  // Get video player URL - FIXED: Handle null properly
  const getVideoPlayerUrl = (videoUrl: string | null | undefined): string | null => {
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
  const sendProgressUpdate = useCallback(
    async (lessonId: string, position: number, duration: number) => {
      if (!userId) return;
      
      // Calculate watch percentage
      const percentage = duration > 0 ? (position / duration) * 100 : 0;
      const roundedPercentage = Math.min(100, Math.round(percentage));
      
      setVideoWatchPercentage(roundedPercentage);

      try {
        const response = await fetch(
          `/api/progress?userId=${encodeURIComponent(userId)}&lessonId=${encodeURIComponent(lessonId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              lastWatchedPosition: Math.floor(position),
              videoPercentageWatched: roundedPercentage,
              watchDuration: Math.floor(position) // Update watch duration
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to save progress');
        }
      } catch (err) {
        console.error("sendProgressUpdate error", err);
      }
    },
    [userId]
  );

  const handleProgressUpdate = (positionSec: number, duration: number) => {
    latestPositionRef.current = positionSec;
    
    // Update local state immediately for UI
    const percentage = duration > 0 ? (positionSec / duration) * 100 : 0;
    setVideoWatchPercentage(Math.min(100, Math.round(percentage)));

    if (progressTimeoutRef.current) {
      window.clearTimeout(progressTimeoutRef.current);
    }

    progressTimeoutRef.current = window.setTimeout(() => {
      sendProgressUpdate(lesson.id, latestPositionRef.current, duration);
      progressTimeoutRef.current = null;
    }, 2000);
  };

  // Handle video time update for HTML5 video elements
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      handleProgressUpdate(currentTime, duration);
    }
  };

  // Handle video loaded metadata
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      setIsVideoLoaded(true);
      
      // Seek to last watched position if available
      if (lessonProgress?.lastWatchedPosition && lessonProgress.lastWatchedPosition > 0) {
        videoRef.current.currentTime = lessonProgress.lastWatchedPosition;
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (progressTimeoutRef.current) {
        window.clearTimeout(progressTimeoutRef.current);
        const duration = videoDuration || (videoRef.current?.duration || 0);
        sendProgressUpdate(lesson.id, latestPositionRef.current, duration).catch(
          () => {}
        );
      }
    };
  }, [lesson.id, sendProgressUpdate, videoDuration]);

  async function markLessonComplete(lessonId: string) {
    if (!userId || isMarkingComplete || !canMarkComplete) return;
    
    setIsMarkingComplete(true);
    try {
      const response = await fetch(
        `/api/progress?userId=${encodeURIComponent(
          userId
        )}&lessonId=${encodeURIComponent(lessonId)}&complete=true`,
        { 
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to mark lesson as complete');
      }

      const result = await response.json();
      
      if (result.success) {
        // Call the parent callback to refresh progress
        if (onLessonCompleted) {
          onLessonCompleted();
        }
        
        // Refresh the page to update UI
        router.refresh();
      } else {
        throw new Error(result.error?.message || 'Failed to mark lesson as complete');
      }
    } catch (err: any) {
      console.error("markLessonComplete error", err);
      alert(err.message || "Failed to mark lesson as complete");
    } finally {
      setIsMarkingComplete(false);
    }
  }

  // Function to render video progress requirement message
  const renderVideoRequirementMessage = () => {
    if (lesson.contentType !== "VIDEO" || !requireVideoWatched || lessonProgress?.isCompleted) {
      return null;
    }

    if (isYouTubeOrVimeo) {
      return (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              External Video Detected
            </span>
          </div>
          <p className="text-xs text-yellow-700">
            This video is hosted on {lesson.videoUrl?.includes('youtube') ? 'YouTube' : 'Vimeo'}. 
            Please watch the entire video before marking as complete.
            Progress tracking is limited for external videos.
          </p>
        </div>
      );
    }

    const percentageText = `${videoWatchPercentage}% watched`;
    const requiredText = `${minVideoWatchPercentage}% required`;
    
    // FIXED: Custom progress bar without indicatorClassName
    return (
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Completion Requirement
            </span>
          </div>
          <Badge 
            variant={videoWatchPercentage >= minVideoWatchPercentage ? "default" : "outline"}
            className={`${
              videoWatchPercentage >= minVideoWatchPercentage 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-blue-100 text-blue-800 border-blue-200"
            }`}
          >
            {percentageText}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                videoWatchPercentage >= minVideoWatchPercentage 
                  ? "bg-green-500" 
                  : "bg-blue-500"
              }`}
              style={{ width: `${videoWatchPercentage}%` }}
            />
          </div>
          <span className="text-xs text-blue-600 font-medium">
            {requiredText}
          </span>
        </div>
        {videoWatchPercentage < minVideoWatchPercentage && (
          <p className="text-xs text-blue-600 mt-2">
            Watch {minVideoWatchPercentage - videoWatchPercentage}% more to unlock "Mark Complete"
          </p>
        )}
      </div>
    );
  };

  // Function to render video player
  const renderVideoPlayer = () => {
    const embedUrl = getVideoPlayerUrl(lesson.videoUrl);

    if (!embedUrl) {
      return (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">Video not available</p>
          <p className="text-sm text-gray-500 mt-2">
            The video content for this lesson is currently unavailable.
          </p>
        </div>
      );
    }

    // For direct video files (HTML5)
    if (embedUrl && (embedUrl.includes(".mp4") || embedUrl.includes(".webm") || embedUrl.includes("amazonaws.com"))) {
      return (
        <video
          ref={videoRef}
          key={embedUrl}
          className="w-full h-full"
          controls
          controlsList="nodownload"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          preload="metadata"
          onTimeUpdate={handleVideoTimeUpdate}
          onLoadedMetadata={handleVideoLoadedMetadata}
          onPlay={() => setIsVideoLoaded(true)}
        >
          <source src={embedUrl} type="video/mp4" />
          <source src={embedUrl} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      );
    }

    // For YouTube/Vimeo - FIXED: Handle null properly
    const videoUrl = lesson.videoUrl || "";
    const isYouTube = videoUrl.includes('youtube') || videoUrl.includes('youtu.be');
    
    return (
      <div className="relative w-full h-full">
        <iframe
          src={`${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=0`}
          className="w-full h-full"
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setIsVideoLoaded(true)}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="text-white text-sm">
              Watching on {isYouTube ? 'YouTube' : 'Vimeo'}
            </div>
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-white hover:text-blue-300 text-sm"
            >
              <ExternalLink className="h-3 w-3" />
              Open in new tab
            </a>
          </div>
        </div>
      </div>
    );
  };

  // FIXED: Safe check for videoUrl string operations
  const getVideoPlatform = () => {
    const videoUrl = lesson.videoUrl || "";
    if (!videoUrl) return "Video Content";
    
    const url = videoUrl.toLowerCase();
    if (url.includes("youtube")) return "YouTube";
    if (url.includes("vimeo")) return "Vimeo";
    if (url.includes("amazonaws.com")) return "AWS S3";
    if (url.includes(".mp4")) return "MP4 Video";
    return "Video Content";
  };

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
                disabled={
                  lessonProgress?.isCompleted || 
                  isMarkingComplete || 
                  !canMarkComplete
                }
                className={`${
                  lessonProgress?.isCompleted
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    : canMarkComplete
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {!canMarkComplete && lesson.contentType === "VIDEO" && requireVideoWatched && !isYouTubeOrVimeo ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Watch {minVideoWatchPercentage}% to Complete
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isMarkingComplete ? "Saving..." : 
                     lessonProgress?.isCompleted ? "Completed" : "Mark Complete"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {lesson.description && (
            <p className="text-gray-700 mb-2">{lesson.description}</p>
          )}

          {/* Video requirement message */}
          {renderVideoRequirementMessage()}
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

              {/* Video Player */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-300">
                {renderVideoPlayer()}
              </div>

              {/* Video Info Section */}
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getVideoPlatform()}
                  </Badge>
                  {videoDuration > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      {Math.floor(videoDuration / 60)}:
                      {String(Math.floor(videoDuration % 60)).padStart(2, "0")}
                    </div>
                  )}
                  {videoWatchPercentage > 0 && !isYouTubeOrVimeo && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {videoWatchPercentage}% watched
                    </Badge>
                  )}
                  {isYouTubeOrVimeo && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      External Video
                    </Badge>
                  )}
                </div>
              </div>
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