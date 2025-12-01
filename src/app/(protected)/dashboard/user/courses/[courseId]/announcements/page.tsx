// src/app/dashboard/user/courses/[courseId]/announcements/page.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Calendar, ChevronLeft, Clock, MessageSquare } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'UPDATE' | 'REMINDER' | 'URGENT';
  publishedAt: string;
  isRead: boolean;
}

interface Course {
  title: string;
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Welcome to the Course!',
    content: 'We\'re thrilled to have you here! Please take a moment to introduce yourself in the discussion forum and review the syllabus.',
    type: 'INFO',
    publishedAt: new Date().toISOString(),
    isRead: false,
  },
  {
    id: '2',
    title: 'Week 1 Materials Now Available',
    content: 'All lectures, readings, and practice exercises for Week 1 have been uploaded. Start early to stay ahead!',
    type: 'UPDATE',
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isRead: true,
  },
  {
    id: '3',
    title: 'Live Q&A Session This Friday',
    content: 'Join us for a live doubt-clearing session this Friday at 7:00 PM IST. Bring your questions!',
    type: 'REMINDER',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    isRead: false,
  },
];

export default function AnnouncementsPage() {
  // const user = useCurrentUser();
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!courseId) return;

      try {
        setLoading(true);

        const [annRes, courseRes] = await Promise.all([
          fetch(`/api/announcements?courseId=${courseId}`),
          fetch(`/api/courses?id=${courseId}`),
        ]);

        // Handle announcements
        if (annRes.ok) {
          const result = await annRes.json();
          if (result.success && Array.isArray(result.data) && result.data.length > 0) {
            setAnnouncements(result.data);
            setUsingMockData(false);
          } else {
            // Empty or no real data → show mock
            setAnnouncements(MOCK_ANNOUNCEMENTS);
            setUsingMockData(true);
          }
        } else {
          // API error → fallback to mock
          setAnnouncements(MOCK_ANNOUNCEMENTS);
          setUsingMockData(true);
        }

        // Handle course title
        if (courseRes.ok) {
          const courseJson = await courseRes.json();
          setCourse(courseJson.data || null);
        }
      } catch (err) {
        console.error('Failed to load announcements, showing demo data', err);
        setAnnouncements(MOCK_ANNOUNCEMENTS);
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [courseId]);

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'URGENT': return 'destructive';
      case 'UPDATE': return 'default';
      case 'REMINDER': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = announcements.filter(a => !a.isRead).length;

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <Skeleton className="h-12 w-96" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Course Announcements</h1>
            <p className="text-muted-foreground mt-2">
              Stay updated with {course?.title ? `"${course.title}"` : 'this course'}
            </p>
            {usingMockData && (
              <p className="text-xs text-orange-600 mt-2">
                Showing demo announcements (no real data yet)
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Bell className="h-5 w-5" />
            <span>{unreadCount} unread</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{announcements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-3xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Latest</p>
                <p className="text-lg font-semibold">
                  {announcements.length > 0 ? formatDate(announcements[0].publishedAt) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">All Announcements</h2>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm">
              Mark All as Read
            </Button>
          )}
        </div>

        <div className="space-y-5">
          {announcements.map((ann) => (
            <Card
              key={ann.id}
              className={!ann.isRead ? 'border-primary/30 bg-primary/5 shadow-sm' : ''}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{ann.title}</h3>
                      {!ann.isRead && (
                        <Badge className="animate-pulse">NEW</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <Badge variant={getBadgeVariant(ann.type)}>
                        {ann.type.toLowerCase()}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(ann.publishedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="prose max-w-none text-foreground/90">
                  <p>{ann.content}</p>
                </div>

                <div className="mt-5 text-right">
                  <Button variant="ghost" size="sm">
                    {ann.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {usingMockData && (
          <div className="text-center text-sm text-muted-foreground mt-8 p-6 bg-muted/50 rounded-lg">
            These are demo announcements. Real announcements will appear here once posted by your instructor.
          </div>
        )}
      </div>
    </div>
  );
}