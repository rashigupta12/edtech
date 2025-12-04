/*eslint-disable @typescript-eslint/no-unused-vars */
// src/app/dashboard/user/courses/[courseId]/announcements/page.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Calendar, ChevronLeft, Clock, MessageSquare, Leaf} from 'lucide-react';
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

  // const getBadgeVariant = (type: string) => {
  //   switch (type) {
  //     case 'URGENT': return 'destructive';
  //     case 'UPDATE': return 'default';
  //     case 'REMINDER': return 'secondary';
  //     default: return 'outline';
  //   }
  // };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'UPDATE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REMINDER': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-teal-100 text-teal-800 border-teal-200';
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
    <div className="p-6 w-full mx-auto space-y-8">
      {/* Header with green theme */}
      <div>
        <Button
          variant="ghost"
          className="mb-6 hover:bg-emerald-50 hover:text-emerald-700"
          onClick={() => router.push(`/dashboard/user/courses/${courseId}`)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg">
                <Leaf className="h-6 w-6 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Course Announcements</h1>
            </div>
            <p className="text-gray-600 mt-2 ml-11">
              Stay updated with {course?.title ? `"${course.title}"` : 'this course'}
            </p>
           
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
            <Bell className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">{unreadCount} unread</span>
          </div>
        </div>
      </div>

      {/* Quick Stats with green theme */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-100 hover:border-green-200 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Announcements</p>
                <p className="text-3xl font-bold text-gray-800">{announcements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 hover:border-emerald-200 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-3xl font-bold text-gray-800">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-lime-100 hover:border-lime-200 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-lime-500 to-green-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Latest Update</p>
                <p className="text-lg font-semibold text-gray-800">
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
          <div className="flex items-center gap-3">
            <div className="h-1 w-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
            <h2 className="text-2xl font-semibold text-gray-800">All Announcements</h2>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              Mark All as Read
            </Button>
          )}
        </div>

        <div className="space-y-5">
          {announcements.map((ann) => (
            <Card
              key={ann.id}
              className={`
                border-l-4 transition-all duration-200 hover:shadow-md
                ${!ann.isRead 
                  ? 'border-l-emerald-500 border-emerald-50 bg-gradient-to-r from-emerald-50/50 to-transparent' 
                  : 'border-l-gray-200 border-gray-50'
                }
              `}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-800">{ann.title}</h3>
                      {!ann.isRead && (
                        <Badge className="animate-pulse bg-gradient-to-r from-emerald-500 to-green-500 border-0 text-white">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className={`px-3 py-1 rounded-full border ${getBadgeColor(ann.type)}`}>
                        {ann.type.toLowerCase()}
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3 w-3" />
                        {formatDate(ann.publishedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="prose max-w-none text-gray-700">
                  <p>{ann.content}</p>
                </div>

                <div className="mt-5 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`
                      hover:bg-emerald-50 hover:text-emerald-700
                      ${ann.isRead ? 'text-gray-600' : 'text-emerald-600'}
                    `}
                  >
                    {ann.isRead ? 'Mark as Unread' : 'Mark as Read'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

       
      </div>

      {/* Green theme decorative elements */}
      <div className="fixed -z-10 top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/20 to-green-100/20 rounded-full blur-3xl"></div>
      <div className="fixed -z-10 bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-teal-100/20 to-emerald-100/20 rounded-full blur-3xl"></div>
    </div>
  );
}