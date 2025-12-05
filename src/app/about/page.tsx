import React from 'react';
import { BookOpen, Users, Target, Award, Globe, Heart, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 px-5 py-2.5 rounded-full mb-8 shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Transforming Education Since 2023</span>
            </div>
            
            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              About <span className="text-emerald-600">Us</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Pioneering the future of digital learning with innovation, accessibility, 
              and student success at our core.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-xl mb-4">
                <Users className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">50,000+</h3>
              <p className="text-gray-500 text-sm">Active Students</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-xl mb-4">
                <BookOpen className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">500+</h3>
              <p className="text-gray-500 text-sm">Courses</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-xl mb-4">
                <Award className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">200+</h3>
              <p className="text-gray-500 text-sm">Expert Instructors</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-xl mb-4">
                <Globe className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">120+</h3>
              <p className="text-gray-500 text-sm">Countries</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Story</h2>
            <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6 text-lg text-gray-600 leading-relaxed">
            <p>
              Founded in 2023, we started with a simple vision: to break down the barriers 
              to quality education. We believe that everyone deserves access to learning 
              opportunities that can transform their lives and careers.
            </p>
            <p>
              What began as a small platform offering coding courses has grown into a 
              comprehensive learning ecosystem serving thousands of students worldwide. 
              We&apos;re proud to partner with top educators and institutions to deliver 
              cutting-edge courses across various disciplines.
            </p>
            <p>
              Our commitment to innovation and student success drives everything we do. 
              We continuously evolve our platform to meet the changing needs of learners 
              in a digital world.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Mission & Vision
            </h2>
            <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Mission */}
            <div className="bg-white rounded-3xl p-10 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-6">
                <Target className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To democratize education by making high-quality learning accessible, affordable, 
                and engaging for everyone, regardless of their background or location. We strive 
                to empower individuals with the skills and knowledge needed to thrive in the 
                21st-century economy.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-3xl p-10 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-6">
                <Heart className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To create a world where anyone, anywhere can access the education they need 
                to achieve their dreams. We envision a future where learning is personalized, 
                interactive, and available throughout one&apos;s lifetime, breaking down traditional 
                barriers to education.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full mb-4"></div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-8 rounded-2xl hover:bg-emerald-50 transition-colors">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-2xl mx-auto mb-6">
                <Shield className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality First</h3>
              <p className="text-gray-600 leading-relaxed">
                We maintain the highest standards in course content, delivery, and student support.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl hover:bg-emerald-50 transition-colors">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-2xl mx-auto mb-6">
                <Users className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Student-Centric</h3>
              <p className="text-gray-600 leading-relaxed">
                Every decision we make puts student success and learning outcomes first.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl hover:bg-emerald-50 transition-colors">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-2xl mx-auto mb-6">
                <TrendingUp className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Accessibility</h3>
              <p className="text-gray-600 leading-relaxed">
                We believe education should be available to everyone, regardless of circumstances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
<section className="py-6 md:py-8 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Left Content */}
      <div className="lg:pr-12">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Limited Time Offer</span>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Transform Your Skills in Just 30 Days
        </h2>
        
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Join thousands who&apos;ve accelerated their careers with our structured learning paths. 
          First month free for new students.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <span className="text-gray-700">Access to all courses for 30 days free</span>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <span className="text-gray-700">Personalized learning recommendations</span>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <span className="text-gray-700">Certificate upon course completion</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Button className='bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl'>
            <Link href="/courses">Explore Courses</Link>
          </Button>
         
        </div>
        
        <p className="text-sm text-gray-500 mt-6">No credit card required • Cancel anytime</p>
      </div>
      
      {/* Right Illustration/Image Placeholder */}
      <div className="relative">
        <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-8 h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-emerald-700" />
            </div>
            <p className="text-gray-700 font-medium">Interactive Learning Dashboard</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
<SiteFooter/>
    </div>
  );
}