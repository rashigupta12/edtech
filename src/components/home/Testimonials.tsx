"use client"
import { Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Testimonial {
  id: string;
  studentName: string;
  studentImage: string | null;
  collegeName: string;
  courseName: string;
  rating: number;
  testimonial: string;
  isApproved: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: Testimonial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/testimonials');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data) {
        const approvedTestimonials = data.data.filter(testimonial => testimonial.isApproved);
        setTestimonials(approvedTestimonials);
      } else {
        throw new Error('Failed to fetch testimonials');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const avatarColors = ['bg-green-600', 'bg-emerald-600', 'bg-teal-600', 'bg-blue-600', 'bg-purple-600'];

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-4">Loading testimonials...</div>
            <p className="text-xl text-gray-600">Please wait</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 px-4 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-4">Error</div>
            <p className="text-xl text-gray-600">{error}</p>
            <button 
              onClick={fetchTestimonials}
              className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-emerald-100/50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full mb-4">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-emerald-900">Rated 4.9/5 by our students</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Success Stories</h2>
          <p className="text-xl text-gray-600">See what our learners have to say</p>
        </div>
        
        {testimonials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No testimonials available yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      size={16} 
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">({testimonial.rating}/5)</span>
                </div>
                
                <p className="text-gray-700 mb-6 italic">&quot;{testimonial.testimonial}&quot;</p>
                
                <div className="flex items-center gap-3">
                  {testimonial.studentImage ? (
                    <Image
                      src={testimonial.studentImage} 
                      alt={testimonial.studentName}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      width={12}
                      height={12}
                    />
                  ) : null}
                  
                  {(!testimonial.studentImage || testimonial.studentImage === null) && (
                    <div 
                      className={`w-12 h-12 ${avatarColors[index % avatarColors.length]} rounded-full flex items-center justify-center text-white font-semibold`}
                    >
                      {testimonial.studentName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.studentName}</div>
                    <div className="text-sm text-gray-600">{testimonial.collegeName}</div>
                    <div className="text-xs text-gray-500 mt-1">Course: {testimonial.courseName}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}