'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Award, TrendingUp, FileText, Bell, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/auth';

interface Course {
  id: string;
  name: string;
  progress: number;
  nextClass: string;
  instructor: string;
  thumbnailUrl?: string;
  level?: string;
  duration?: string;
  enrolledAt?: Date;
  status?: string;
}

interface Assignment {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: string;
}

interface Grade {
  id: number;
  assignment: string;
  course: string;
  grade: string;
  score: number;
}

export default function StudentDashboard() {
  const user = useCurrentUser();
  const userLoading = !user;
  const userId = user?.id;
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchEnrolledCourses();
    }
  }, [user]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      // Fetch user's enrolled courses
      const response = await fetch(`/api/enrollments?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        // Transform enrollment data to course format
        const enrolledCourses: Course[] = data.data.map((enrollment: any) => ({
          id: enrollment.courseId,
          name: enrollment.courseTitle || 'Course Title',
          progress: enrollment.progress || 0,
          nextClass: 'Today, 2:00 PM', // Calculate based on your schedule logic
          instructor: enrollment.instructor || 'Instructor',
          thumbnailUrl: enrollment.thumbnailUrl,
          level: enrollment.level,
          duration: enrollment.duration,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status
        }));
        setCourses(enrolledCourses);
      } else {
        setError(data.error?.message || 'Failed to fetch enrolled courses');
      }
    } catch (err) {
      setError('Failed to load enrolled courses');
      console.error('Error fetching enrolled courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingAssignments: Assignment[] = [
    { id: 1, title: 'Algorithm Analysis Essay', course: 'Data Structures', dueDate: 'Dec 5, 2025', status: 'pending' },
    { id: 2, title: 'React Project Submission', course: 'Web Development', dueDate: 'Dec 8, 2025', status: 'in-progress' },
    { id: 3, title: 'Database Design Document', course: 'Database Systems', dueDate: 'Dec 10, 2025', status: 'pending' }
  ];

  const recentGrades: Grade[] = [
    { id: 1, assignment: 'Midterm Exam', course: 'Computer Science', grade: 'A', score: 92 },
    { id: 2, assignment: 'Binary Trees Lab', course: 'Data Structures', grade: 'A-', score: 88 },
    { id: 3, assignment: 'CSS Flexbox Quiz', course: 'Web Development', grade: 'B+', score: 85 }
  ];

  const calculateAverageProgress = (): number => {
    if (courses.length === 0) return 0;
    const total = courses.reduce((sum, course) => sum + (course.progress || 0), 0);
    return Math.round(total / courses.length);
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name?.split(' ')[0] || 'Student'}!
          </h2>
          <p className="text-gray-600">Here's what's happening with your courses today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Active Courses</span>
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Assignments Due</span>
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">3</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avg. Progress</span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{calculateAverageProgress()}%</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">GPA</span>
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">3.7</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">My Courses</h3>
              </div>
              <div className="p-6 space-y-4">
                {courses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No enrolled courses yet</p>
                    <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Browse Courses
                    </button>
                  </div>
                ) : (
                  courses.map(course => (
                    <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{course.name}</h4>
                          <p className="text-sm text-gray-600">{course.instructor}</p>
                        </div>
                        <span className="text-sm font-medium text-green-600">{course.progress}%</span>
                      </div>
                      <div className="mb-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        Next class: {course.nextClass}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Grades */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Grades</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {recentGrades.map(grade => (
                    <div key={grade.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{grade.assignment}</p>
                        <p className="text-sm text-gray-600">{grade.course}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{grade.grade}</p>
                        <p className="text-sm text-gray-600">{grade.score}/100</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Assignments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h3>
              </div>
              <div className="p-6 space-y-4">
                {upcomingAssignments.map(assignment => (
                  <div key={assignment.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{assignment.title}</h4>
                      {assignment.status === 'in-progress' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">In Progress</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{assignment.course}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      Due: {assignment.dueDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6 space-y-2">
                <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  View All Courses
                </button>
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  My Assignments
                </button>
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Grade Book
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}