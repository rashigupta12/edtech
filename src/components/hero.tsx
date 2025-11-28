'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-100">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200/10 via-yellow-100/10 to-blue-300/10" />

      {/* Animated Gradient Orbs (lightweight) */}
      <div className="absolute inset-0 overflow-hidden">
        {[
          { pos: 'top-1/4 left-1/4', colors: 'from-yellow-200 to-yellow-300', delay: 0 },
          { pos: 'bottom-1/4 right-1/4', colors: 'from-blue-200 to-blue-300', delay: 0.3 },
          { pos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', colors: 'from-yellow-100 to-blue-100', delay: 0.6 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 0.25, scale: 1 }}
            transition={{ duration: 1, delay: orb.delay, ease: 'easeOut' }}
            viewport={{ once: true }}
            className={`absolute ${orb.pos} w-64 h-64 bg-gradient-to-r ${orb.colors} rounded-full blur-2xl will-change-transform`}
          />
        ))}
      </div>

      {/* Geometric Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[
          { pos: 'top-10 right-20', shape: 'rounded-lg rotate-45', border: 'border-yellow-400', size: 'w-56 h-56', delay: 0 },
          { pos: 'bottom-20 left-10', shape: 'rounded-full', border: 'border-blue-400', size: 'w-40 h-40', delay: 0.2 },
        ].map((geo, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 0.08, scale: 1 }}
            transition={{ duration: 0.8, delay: geo.delay, ease: 'easeOut' }}
            viewport={{ once: true }}
            className={`absolute ${geo.pos} ${geo.size} border-4 ${geo.border} ${geo.shape} will-change-transform`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 leading-tight mb-3">
              Futuretek Institute
            </h1>
            <div className="text-2xl md:text-3xl lg:text-4xl font-light bg-gradient-to-r from-blue-600 via-yellow-600 to-blue-800 bg-clip-text text-transparent">
              Of Astrological Sciences
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Master the ancient wisdom of astrology through comprehensive courses, 
            expert guidance, and globally recognized certifications.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
          >
            <Link href="/courses">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-lg shadow-lg flex items-center gap-3"
              >
                <span>Explore Courses</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  →
                </motion.span>
              </motion.button>
            </Link>

            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg"
              >
                Schedule Consultation
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="pt-8 border-t border-slate-200/60"
          >
            <div className="flex justify-center items-center gap-8 text-slate-600">
              {[
                { num: '5,000+', label: 'Students Enrolled', color: 'from-blue-600 to-blue-800' },
                { num: '50+', label: 'Expert Instructors', color: 'from-yellow-600 to-yellow-800' },
                { num: '15+', label: 'Years Experience', color: 'from-blue-600 to-blue-800' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.num}
                  </div>
                  <div className="text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
