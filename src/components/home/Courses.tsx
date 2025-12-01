"use client"
import { Star, Clock, Users, BookOpen, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

interface Course {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  duration: string;
  level: string;
  language: string;
  status: string;
  isFeatured: boolean;
  currentEnrollments: number;
  createdAt: string;
  collegeName: string | null;
  categoryName: string;
  price: string | null;
  isFree: boolean;
}

export default function FeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: string | null, isFree: boolean) => {
    if (isFree) return "Free";
    if (price) return `$${parseFloat(price).toFixed(2)}`;
    return "Free";
  };

  const formatDuration = (duration: string) => {
    const hours = parseInt(duration);
    if (hours >= 60) {
      const days = Math.floor(hours / 60);
      const remainingHours = hours % 60;
      if (remainingHours === 0) {
        return `${days}d`;
      }
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/courses');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          const publishedCourses = data.data.filter((course: Course) => 
            course.status === 'PUBLISHED'
          );
          setCourses(publishedCourses);
        } else {
          throw new Error('Failed to load courses');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full mb-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-900">Most Popular</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Courses</h2>
            <p className="text-slate-600">Loading amazing courses...</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
                <div className="h-40 bg-slate-200 rounded-xl mb-4"></div>
                <div className="h-5 bg-slate-200 rounded mb-3"></div>
                <div className="h-4 bg-slate-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 border border-red-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Oops! Something went wrong</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return (
      <section className="py-8 px-4 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 border border-slate-200">
            <BookOpen className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Courses Yet</h2>
            <p className="text-slate-600">Check back soon for amazing courses!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4 bg-gradient-to-b from-emerald-50/50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full mb-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-emerald-900">Most Popular</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Courses</h2>
          <p className="text-slate-600">Handpicked courses to accelerate your learning journey</p>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course.id} 
              className="group bg-green-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              {/* Course Image/Thumbnail */}
              <div className="relative h-44 bg-gradient-to-br from-emerald-500 to-emerald-700 overflow-hidden">
                {course.thumbnailUrl ? (
                  <img 
                    src={course.thumbnailUrl} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="text-white text-center">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-90" />
                      <h3 className="text-lg font-bold">{course.title}</h3>
                    </div>
                  </div>
                )}
                
                {/* Level Badge */}
                <div className="absolute top-3 right-3">
                  <span className="bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
                    {course.level}
                  </span>
                </div>

                {/* Category Badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium px-3 py-1 rounded-full">
                    {course.categoryName}
                  </span>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-5">
                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                  {course.title}
                </h3>

                {/* College Name */}
                {course.collegeName && (
                  <p className="text-xs text-slate-500 mb-3">by {course.collegeName}</p>
                )}

                {/* Description */}
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {course.shortDescription || 'Enhance your skills with this comprehensive course'}
                </p>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">4.5</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{course.currentEnrollments.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(course.duration)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-2xl font-bold text-emerald-700">
                      {formatPrice(course.price, course.isFree)}
                    </span>
                    {!course.isFree && course.price && (
                      <span className="text-slate-400 text-xs line-through ml-2">
                        ${(parseFloat(course.price) * 1.5).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button className="flex items-center gap-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all group-hover:gap-2 text-sm font-medium">
                    {course.isFree ? 'Enroll Free' : 'Enroll'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-10">
          <button className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-3 rounded-lg border-2 border-emerald-600 hover:bg-emerald-600 hover:text-white transition-all font-medium">
            View All Courses
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}