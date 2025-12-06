import React from 'react';
import HeroSection from '@/components/home/Herosection';
import Stats from '@/components/home/Stats';
import FeaturedCourses from '@/components/home/Courses';
import Features from '@/components/home/Features';
import CTA from '@/components/home/Cta';
import Testimonials from '@/components/home/Testimonials';
import { SiteFooter } from '@/components/site-footer';


export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <Stats />
      <FeaturedCourses />
      <Features />
      <Testimonials/>
      <CTA />
      <SiteFooter/>
    </div>
  );
}