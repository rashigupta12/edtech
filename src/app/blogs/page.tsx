// app/blog/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Blog {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  viewCount: number;
  authorName: string;
}

interface BlogResponse {
  blogs: Blog[];
}

export default function BlogPage() {
  const router = useRouter();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 9;

  // Fetch on mount & when page changes
  useEffect(() => {
    fetchBlogs();
  }, [currentPage]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: blogsPerPage.toString(),
        offset: ((currentPage - 1) * blogsPerPage).toString(),
      });

      const response = await fetch(`/api/blogs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch blogs');

      const data: BlogResponse = await response.json();

      // Append new blogs for "Load More"
      setBlogs((prev) =>
        currentPage === 1 ? data.blogs : [...prev, ...data.blogs]
      );
    } catch (err) {
      setError('Failed to load blogs. Please try again later.');
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // -----------------------------------------------------------------
  //  Click handler – navigate to detail page (view count is updated on the detail API)
  // -----------------------------------------------------------------
  const handleReadMore = (slug: string) => {
    router.push(`/blogs/${slug}`);
  };

  /* --------------------------------------------------------------
     Skeleton – shown only on the very first load
  -------------------------------------------------------------- */
  if (loading && blogs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">
              FutureTek Astrology Blog
            </h1>
            <p className="text-lg text-blue-700 max-w-2xl mx-auto">
              Explore cosmic wisdom and astrological insights to guide your journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-lg p-6 animate-pulse"
              >
                <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-300 h-3 rounded w-full mb-2"></div>
                <div className="bg-gray-300 h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            FutureTek <span className="text-gold-500">Astrology</span> Blog
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
            Discover cosmic insights, planetary influences, and astrological wisdom
            to illuminate your path forward with FutureTek&apos;s expert guidance.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8 text-center">
            {error}
          </div>
        )}

        {/* Blog Grid */}
        {blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {blogs.map((blog) => (
              <article
                key={blog.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-blue-100"
              >
                {/* No thumbnail – keep the original spacing */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-blue-600 font-medium">
                      {formatDate(blog.publishedAt)}
                    </span>
                    <span className="text-sm text-gold-600 font-medium flex items-center">
                      View Count: {blog.viewCount} views
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-blue-900 mb-3 line-clamp-2 leading-tight">
                    {blog.title}
                  </h3>

                  <p className="text-blue-700 mb-4 line-clamp-3 leading-relaxed">
                    {blog.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600 font-medium">
                      By {blog.authorName}
                    </span>

                    {/* ---- READ MORE BUTTON (navigates to detail) ---- */}
                    <button
                      onClick={() => handleReadMore(blog.slug)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      Read More
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">No Articles</div>
              <h3 className="text-2xl font-semibold text-blue-900 mb-2">
                No articles found
              </h3>
              <p className="text-blue-700">
                No articles available at the moment.
              </p>
            </div>
          )
        )}

        {/* Load More Button */}
        {blogs.length >= blogsPerPage && (
          <div className="text-center">
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={loading}
              className="bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-blue-900 px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Articles'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}