/*eslint-disable  @typescript-eslint/no-unused-vars*/
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Eye, AlertCircle, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  viewCount: number;
  authorName: string | null;
}

interface BlogsResponse {
  blogs: BlogPost[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// AutoScrollSection Component
function AutoScrollSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cards = container.children;
    if (cards.length <= 1) return;

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % cards.length;
          scrollToIndex(nextIndex);
          return nextIndex;
        });
      }, 3000); // Scroll every 3 seconds
    };

    const stopAutoScroll = () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };

    const scrollToIndex = (index: number) => {
      if (container && cards[index]) {
        const card = cards[index] as HTMLElement;
        const scrollLeft = card.offsetLeft - container.offsetLeft;
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    };

    // Start auto-scroll
    startAutoScroll();

    // Pause auto-scroll on hover/touch
    container.addEventListener('mouseenter', stopAutoScroll);
    container.addEventListener('mouseleave', startAutoScroll);
    container.addEventListener('touchstart', stopAutoScroll);
    container.addEventListener('touchend', () => {
      setTimeout(startAutoScroll, 5000); // Resume after 5 seconds of no touch
    });

    return () => {
      stopAutoScroll();
      container.removeEventListener('mouseenter', stopAutoScroll);
      container.removeEventListener('mouseleave', startAutoScroll);
      container.removeEventListener('touchstart', stopAutoScroll);
      container.removeEventListener('touchend', startAutoScroll);
    };
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className={`flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory scroll-smooth hide-scrollbar ${className}`}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {children}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export function Blogs() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/blogs?limit=6');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch blogs: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response format from server');
        }
        
        const data: BlogsResponse = await response.json();
        setBlogPosts(data.blogs || []);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load blogs');
      } finally {
        setLoading(false);
      }
    }

    fetchBlogPosts();
  }, []);

  // Loading state
  if (loading) {
    return (
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Loader2 className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Loading blogs...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white rounded-2xl border border-red-100 p-8">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Unable to Load Blogs
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gray-900 hover:bg-gray-800 px-6 py-2 h-auto text-sm"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (blogPosts.length === 0) {
    return (
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white rounded-2xl border border-slate-200 p-8">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No Blog Posts Available
            </h3>
            <p className="text-gray-600">
              Check back soon for new articles!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-sm font-medium mb-4 border border-blue-100">
            <Calendar className="h-4 w-4" />
            <span>Latest Insights</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            From Our Blog
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Stay updated with expert insights on astrology, Vastu, and personal growth.
          </p>
        </div>

        {/* Horizontal Scroll with Auto-scroll for both mobile and desktop */}
        <AutoScrollSection className="mb-12">
          {blogPosts.map((post) => (
            <div
              key={post.id}
              className="w-[85vw] sm:w-[400px] lg:w-[350px] flex-shrink-0 snap-start"
            >
              <BlogCard post={post} />
            </div>
          ))}
        </AutoScrollSection>

        {/* View All CTA */}
        <div className="text-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-8 py-3"
          >
            <Link href="/blogs" className="flex items-center gap-2">
              View All Posts
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// Blog Card Component
function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Card className="group h-full bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col hover:border-blue-200">
      {/* Golden Top Accent */}
      <div className="h-1 bg-gradient-to-r from-yellow-500 to-yellow-600" />

      <CardHeader className="pb-3 pt-4 px-4">
        {/* Meta information - Compact */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{post.viewCount}</span>
          </div>
        </div>

        <CardTitle className="text-lg font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
          {post.title}
        </CardTitle>

        {/* Author information */}
        {post.authorName && (
          <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
            <User className="h-3 w-3" />
            <span>By {post.authorName}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-3 px-4">
        <CardDescription className="text-slate-600 leading-relaxed line-clamp-3 text-sm">
          {post.excerpt}
        </CardDescription>
      </CardContent>

      <CardFooter className="pt-3 px-4 pb-4">
        <Button
          asChild
          variant="ghost"
          className="w-full group/button justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium transition-all duration-200 rounded-lg text-sm py-2"
        >
          <Link href={`/blogs/${post.slug}`} className="flex items-center gap-1">
            <span>Read More</span>
            <ArrowRight className="h-3 w-3 ml-1 group-hover/button:translate-x-1 transition-transform duration-200" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}