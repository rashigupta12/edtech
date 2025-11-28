// app/blog/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import React from 'react';

interface Blog {
  id: string;
  slug: string;
  title: string;
  content: string;
  publishedAt: string;
  viewCount: number;
  authorName: string;
  authorId: string;
  tags: string[];
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  // Unwrap the params using React.use()
  const { slug } = React.use(params);
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/blogs/${slug}`);

        if (!res.ok) {
          if (res.status === 404) notFound();
          throw new Error('Failed to fetch blog');
        }

        const data = await res.json();
        setBlog(data.blog);
      } catch (err) {
        setError('Failed to load the blog. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]); // Use slug instead of params.slug

  const readingTime = blog
    ? Math.max(1, Math.ceil(blog.content.split(/\s+/).length / 200))
    : 0;

  if (loading) return <BlogSkeleton />;
  if (error || !blog) return <ErrorState message={error || 'Blog not found'} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Link
            href="/blogs"
            className="inline-block mb-6 text-blue-200 hover:text-white transition-colors"
          >
            Back to Blog
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {blog.title}
          </h1>
          <div className="flex flex-wrap justify-center items-center gap-4 text-blue-200 text-sm md:text-base">
            <span>By {blog.authorName}</span>
            <span>•</span>
            <span>{format(new Date(blog.publishedAt), 'MMMM d, yyyy')}</span>
            <span>•</span>
            <span>{readingTime} min read</span>
            <span>•</span>
            <span className="flex items-center">
              View Count: {blog.viewCount} views
            </span>
          </div>
        </div>
      </header>

      {/* Main Content – CONSTRAINED */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto overflow-x-hidden">
          {/* Tags */}
          {blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gold-100 text-gold-800 text-sm font-medium rounded-full border border-gold-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Article – RESPONSIVE & CLIPPED */}
          <article
            className="
              prose prose-lg max-w-none
              prose-headings:text-blue-900
              prose-p:text-blue-800
              prose-a:text-blue-600 hover:prose-a:text-blue-800
              prose-strong:text-blue-900
              prose-blockquote:border-l-gold-500 prose-blockquote:bg-gold-50
              prose-ul:text-blue-800
              prose-li:marker:text-gold-600
              prose-hr:border-blue-200

              /* ---- RESPONSIVE FIXES ---- */
              [&_*]:max-w-full
              [&>img]:w-full [&>img]:h-auto
              [&>table]:block [&>table]:overflow-x-auto [&>table]:whitespace-nowrap
              [&>pre]:overflow-x-auto
              [&>iframe]:w-full [&>iframe]:h-auto [&>iframe]:aspect-video
            "
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Share Section */}
          <div className="mt-16 pt-8 border-t border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Share this article
            </h3>
            <div className="flex gap-3">
              <ShareButton platform="Twitter" color="bg-sky-500" />
              <ShareButton platform="LinkedIn" color="bg-blue-700" />
              <ShareButton platform="Facebook" color="bg-indigo-600" />
              <ShareButton platform="Copy Link" color="bg-gray-600" copy />
            </div>
          </div>

          {/* Author Bio */}
          <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-4">
              {/* <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {blog.authorName.charAt(0)}
              </div> */}
              <div>
                <p className="font-semibold text-blue-900">{blog.authorName}</p>
                <p className="text-blue-700 text-sm">Astrology Expert at FutureTek</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------
   Skeleton Loader
------------------------------------------------------------------ */
function BlogSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="h-6 bg-blue-400 rounded w-32 mx-auto mb-6"></div>
          <div className="h-10 bg-blue-400 rounded w-11/12 mx-auto mb-4"></div>
          <div className="h-10 bg-blue-400 rounded w-10/12 mx-auto"></div>
          <div className="flex justify-center gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-blue-400 rounded w-20"></div>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl animate-pulse">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gold-200 rounded-full w-24"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="h-4 bg-blue-100 rounded"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            ></div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------
   Error State
------------------------------------------------------------------ */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center py-12">
      <div className="text-center">
        <div className="text-6xl mb-4">Crystal Ball</div>
        <h1 className="text-3xl font-bold text-blue-900 mb-2">
          Oops! Something went wrong
        </h1>
        <p className="text-blue-700 mb-6">{message}</p>
        <Link
          href="/blogs"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
        >
          Back to Blog
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Share Button Component
------------------------------------------------------------------ */
function ShareButton({
  platform,
  color,
  copy,
}: {
  platform: string;
  color: string;
  copy?: boolean;
}) {
  const handleClick = () => {
    if (copy) {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } else {
      alert(`Share on ${platform} (coming soon)`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${color} hover:opacity-90 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2`}
    >
      {platform === 'Copy Link' ? 'Link' : platform}
    </button>
  );
}