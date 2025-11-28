/*eslint-disable  @typescript-eslint/no-unused-vars*/
"use client";

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, Quote, Users, Award, ThumbsUp } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

const testimonials = [
  {
    name: 'Sarah J.',
    avatar: '/placeholder.svg?height=40&width=40',
    testimonial: 'The KP Astrology course has transformed my understanding of chart analysis. Highly recommended!',
    rating: 5,
    course: 'KP Astrology'
  },
  {
    name: 'Michael R.',
    avatar: '/placeholder.svg?height=40&width=40',
    testimonial: 'Thanks to the Financial Astrology course, I\'ve gained valuable insights into market trends. It\'s been a game-changer for my investments.',
    rating: 5,
    course: 'Financial Astrology'
  },
  {
    name: 'Priya M.',
    avatar: '/placeholder.svg?height=40&width=40',
    testimonial: 'The Vastu Shastra course provided practical knowledge that I\'ve successfully applied to improve the energy in my home and office.',
    rating: 5,
    course: 'Vastu Shastra'
  },
  {
    name: 'Rajesh K.',
    avatar: '/placeholder.svg?height=40&width=40',
    testimonial: 'The Astro-Vastu integration course gave me a holistic approach to space optimization. Amazing content!',
    rating: 5,
    course: 'Astro-Vastu Integration'
  },
  {
    name: 'Lisa T.',
    avatar: '/placeholder.svg?height=40&width=40',
    testimonial: 'Professional instructors and well-structured curriculum. The KP Astrology course exceeded my expectations.',
    rating: 5,
    course: 'KP Astrology'
  },
  {
    name: 'David L.',
    avatar: '/placeholder.svg?height=40&width=40',
    testimonial: 'Practical approach with real-world applications. The Financial Astrology course is worth every penny.',
    rating: 5,
    course: 'Financial Astrology'
  },
]

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
      }, 1000); // Scroll every 3 seconds
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


export function Testimonials() {
  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-gray-600 mb-4">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Student Testimonials
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Hear from our students about their learning experience and success stories
          </p>
        </div>

        {/* Testimonials Grid with Auto-scroll */}
        <AutoScrollSection className="mb-16">
          {testimonials.map((testimonial, index) => (
           <Card 
  key={index} 
  className="group border border-gray-200 bg-white hover:shadow-lg transition-all duration-300 hover:border-gray-300 shadow-md relative overflow-hidden w-[85vw] sm:w-[400px] lg:w-[350px] flex-shrink-0 snap-start"
>
              {/* Top Border Gradient */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="h-12 w-12 text-gray-400" />
              </div>
              
              <CardContent className="pt-8 pb-6 px-6">
                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="h-4 w-4 fill-yellow-400 text-yellow-400" 
                    />
                  ))}
                </div>
                
                {/* Testimonial Text */}
                <p className="text-gray-700 leading-relaxed text-[15px] mb-4">
                  {testimonial.testimonial}
                </p>
                
                {/* Course Badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                  {testimonial.course}
                </div>
              </CardContent>
              
              <CardFooter className="flex items-center gap-4 pt-4 border-t border-gray-100 px-6 pb-6">
                <Avatar className="h-12 w-12 border-2 border-gray-100">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                  <p className="text-gray-600 text-xs">Verified Student</p>
                </div>
                <ThumbsUp className="h-5 w-5 text-green-500 flex-shrink-0" />
              </CardFooter>
            </Card>
          ))}
        </AutoScrollSection>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-gray-200">
          {[
            {
              icon: Users,
              value: "500+",
              label: "Students Enrolled",
              description: "Across all courses"
            },
            {
              icon: Star,
              value: "4.9/5",
              label: "Average Rating",
              description: "Based on student feedback"
            },
            {
              icon: Award,
              value: "98%",
              label: "Satisfaction Rate",
              description: "Student success rate"
            }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-gray-900 font-medium mb-1">{stat.label}</div>
              <div className="text-gray-500 text-sm">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Trust Indicator */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            Join hundreds of satisfied students who have transformed their understanding of ancient sciences
          </p>
        </div>
      </div>
    </section>
  )
}