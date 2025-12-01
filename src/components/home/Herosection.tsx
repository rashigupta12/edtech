import React from 'react';
import { BookOpen, Users, Award, ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-white to-emerald-700/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span className="text-xs font-medium text-emerald-900">
                50,000+ learners worldwide
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              Learn Skills for
              <span className="block mt-1 bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                Your Future
              </span>
            </h1>
            
            <p className="text-base text-slate-600 leading-relaxed">
              Access expert-led courses and advance your career with our comprehensive learning platform.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <button className="group px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-6 py-3 bg-white text-slate-700 rounded-lg font-medium border border-slate-200 hover:border-emerald-600 hover:text-emerald-700 transition-all">
                Browse Courses
              </button>
            </div>
          </div>
          
          {/* Right Content - Cards Grid */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1 */}
              <div className="bg-white rounded-xl p-4 shadow border border-slate-100 hover:shadow-md transition-all hover:border-emerald-200">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3 border border-emerald-200">
                  <BookOpen className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">500+ Courses</h3>
                <p className="text-xs text-slate-600">Expert curriculum</p>
              </div>
              
              {/* Card 2 */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl p-4 shadow text-white mt-6 hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-3 border border-white/20">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Live Sessions</h3>
                <p className="text-xs text-emerald-100">Interactive learning</p>
              </div>
              
              {/* Card 3 */}
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-xl p-4 shadow text-white hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-3 border border-white/20">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Certificates</h3>
                <p className="text-xs text-emerald-100">Verified credentials</p>
              </div>
              
              {/* Card 4 */}
              <div className="bg-white rounded-xl p-4 shadow border border-slate-100 mt-6 hover:shadow-md transition-all hover:border-emerald-200">
                <div className="text-2xl font-bold text-emerald-700 mb-1">98%</div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Success Rate</h3>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[98%] bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}