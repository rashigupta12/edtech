/*eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Clock, Video, FileText, ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ReactPlayer from 'react-player';
import { useCurrentUser } from '@/hooks/auth';

export default function LessonPage() {
  const user = useCurrentUser();
  const userId = user?.id;
  const { courseId, lessonId } = useParams();
  const router = useRouter();

  const [lesson, setLesson] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [note, setNote] = useState('');

  // Fetch lesson
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await fetch(`/api/courses?id=${courseId}&curriculum=true`);
        const data = await response.json();
        const all = data.data.modules.flatMap((m: { lessons: any; }) => m.lessons);
        const found = all.find((l: { id: string | string[] | undefined; }) => l.id === lessonId);
        setLesson(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLesson(false);
      }
    };
    fetchLesson();
  }, [courseId, lessonId]);

  // Fetch progress
  useEffect(() => {
    if (!userId) return;
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/progress?userId=${userId}&lessonId=${lessonId}`);
        if (!response.ok) return;
        const data = await response.json();
        setProgress(data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProgress();
  }, [userId, lessonId]);

  // Update progress
  const updateProgress = useCallback(async (position: any) => {
    try {
      await fetch(`/api/progress?userId=${userId}&lessonId=${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastWatchedPosition: position })
      });
    } catch (err) {
      console.error(err);
    }
  }, [userId, lessonId]);

  const markComplete = async () => {
    try {
      const response = await fetch(`/api/progress?userId=${userId}&lessonId=${lessonId}&complete=true`, {
        method: 'POST'
      });
      if (response.ok) {
        const result = await response.json();
        setProgress(result.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveNote = async () => {
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lessonId, content: note })
      });
      setNote('');
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingLesson) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Lesson not found</h1>
        <Button onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn`)}>
          Back to Learning
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn`)}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Course
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">
                {lesson.contentType === 'VIDEO' && <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Video</span>}
                {lesson.contentType === 'ARTICLE' && <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Article</span>}
              </Badge>
              {lesson.videoDuration && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {Math.floor(lesson.videoDuration / 60)} min
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          variant={progress?.isCompleted ? 'secondary' : 'default'}
          onClick={markComplete}
          disabled={progress?.isCompleted}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {progress?.isCompleted ? 'Completed' : 'Mark Complete'}
        </Button>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {lesson.contentType === 'VIDEO' && lesson.videoUrl && (
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <ReactPlayer
                    url={lesson.videoUrl}
                    width="100%"
                    height="100%"
                    controls
                    onProgress={(e: { playedSeconds: any; }) => updateProgress(e.playedSeconds)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {lesson.contentType === 'ARTICLE' && (
            <Card>
              <CardHeader><CardTitle>Article Content</CardTitle></CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {lesson.articleContent ? (
                    <div dangerouslySetInnerHTML={{ __html: lesson.articleContent }} />
                  ) : (
                    <p className="text-muted-foreground">Article content not available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {lesson.description && (
            <Card>
              <CardHeader><CardTitle>About this lesson</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{lesson.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Your Progress</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant={progress?.isCompleted ? 'default' : 'secondary'}>
                    {progress?.isCompleted ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
                {progress?.completedAt && (
                  <div className="flex justify-between">
                    <span>Completed on</span>
                    <span className="font-medium">
                      {new Date(progress.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">My Notes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea placeholder="Add your notes here..." value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[100px]" />
                <div className="flex justify-end">
                  <Button size="sm" onClick={saveNote} disabled={!note.trim()}>Save Note</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Navigation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/dashboard/user/courses/${courseId}/learn`)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Learning
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/dashboard/user/courses/${courseId}/syllabus`)}>
                View Course Syllabus
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}>
                Course Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {lesson.resources && lesson.resources.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Lesson Resources</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lesson.resources.map((r: { name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; type: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }, i: Key | null | undefined) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-muted-foreground">{r.type}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Download</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
