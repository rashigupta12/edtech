"use client";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Heart, Star, Users } from "lucide-react";
import Link from "next/link";

const openings = [
  {
    title: "KP Astrology Instructor",
    description:
      "We are seeking an experienced KP Astrology practitioner to join our team as an instructor. The ideal candidate should have at least 5 years of experience in KP Astrology and a passion for teaching.",
    requirements: [
      "5+ years of experience in KP Astrology",
      "Excellent communication skills",
      "Teaching experience preferred",
    ],
  },
  {
    title: "Vastu Consultant",
    description:
      "We are looking for a Vastu Shastra expert to provide consultations and contribute to our Vastu courses. The ideal candidate should have a deep understanding of Vastu principles and their modern applications.",
    requirements: [
      "Degree in Architecture or related field",
      "Certification in Vastu Shastra",
      "Minimum 3 years of consulting experience",
    ],
  },
  {
    title: "Content Writer (Astrology)",
    description:
      "We need a talented content writer with knowledge of astrology to create engaging and informative content for our blog, courses, and social media platforms.",
    requirements: [
      "Strong writing skills in English",
      "Knowledge of astrology (preferably KP Astrology)",
      "Experience in content creation for digital platforms",
    ],
  },
];

const benefits = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "Expert Community",
    description:
      "Opportunity to work with leading experts in the field of astrology and Vastu",
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Continuous Learning",
    description: "Continuous learning and professional development",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Positive Impact",
    description:
      "Chance to make a positive impact on people's lives through ancient wisdom",
  },
];

export default function CareerPage() {
  return (
    <>
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-yellow-200">
              <Star className="w-4 h-4" />
              Join Our Mission to Spread Ancient Wisdom
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-yellow-600 bg-clip-text text-transparent mb-6">
              Career Opportunities
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Join our team of experts and contribute to the world of
              astrological sciences. We offer a dynamic work environment and
              opportunities for growth and learning.
            </p>
          </div>

          {/* Current Openings */}
          <section className="text-center mb-20 max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 text-slate-800">
                Current Openings
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Explore our current career opportunities and join our mission to
                spread astrological wisdom
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 ">
              {openings.map((job, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-0 relative overflow-hidden"
                >
                  {/* Top Border */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl text-slate-800 group-hover:text-blue-700 transition-colors">
                      {job.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-slate-600 mb-4 leading-relaxed text-sm">
                      {job.description}
                    </p>
                    <div>
                      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-slate-700">
                        Requirements:
                      </h4>
                      <ul className="space-y-2">
                        {job.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                            <span className="text-sm text-slate-600">
                              {req}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  {/* <CardFooter>
                    <Link href="/auth/login" className="w-full">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 group">
                        Apply Now
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardFooter> */}
                </Card>
              ))}
            </div>
          </section>

          {/* Why Work With Us – Enhanced */}
          <section className=" mb-20 max-w-7xl mx-auto">
            <Card className="relative overflow-hidden bg-white border border-slate-200 shadow-lg">
              {/* Simple Golden Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>

              <CardHeader className="text-center pt-12 pb-8">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-800">
                  Why Work With Us?
                </h2>
                <p className="mt-3 text-slate-600 text-lg max-w-2xl mx-auto">
                  Be part of a visionary institute blending ancient wisdom with
                  modern teaching
                </p>
              </CardHeader>

              <CardContent className="pb-12">
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto px-6">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.2 }}
                      viewport={{ once: true }}
                      className="group text-center"
                    >
                      <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                        <div className="text-blue-600">{benefit.icon}</div>
                      </div>

                      <h3 className="text-xl font-bold mb-3 text-slate-800">
                        {benefit.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed text-sm">
                        {benefit.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
          {/* Additional Benefits – Enhanced */}
          <section className=" mb-12 max-w-7xl mx-auto">
            <Card className="relative overflow-hidden bg-white/90 backdrop-blur-md border-0 shadow-xl">
              {/* Golden Top Border */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600"></div>

              <CardHeader className="pb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 text-center">
                  Additional Benefits
                </h2>
                <p className="text-center text-slate-600 mt-2 max-w-2xl mx-auto">
                  We nurture talent with a holistic approach to professional and
                  personal growth
                </p>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto px-6">
                  {/* Work Environment */}
                  <div>
                    <h3 className="text-xl font-bold text-blue-700 mb-6 flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-md"></div>
                      Work Environment
                    </h3>
                    <ul className="space-y-4">
                      {[
                        "Flexible work environment with remote options",
                        "Dynamic and supportive team culture",
                        "Modern workspace with positive energy",
                      ].map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          viewport={{ once: true }}
                          className="flex items-start gap-4 group"
                        >
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: 360 }}
                            transition={{ duration: 0.4 }}
                            className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0 shadow-sm"
                          />
                          <span className="text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                            {item}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Compensation & Growth */}
                  <div>
                    <h3 className="text-xl font-bold text-blue-700 mb-6 flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-md"></div>
                      Compensation & Growth
                    </h3>
                    <ul className="space-y-4">
                      {[
                        "Competitive salary and performance bonuses",
                        "Opportunities for professional growth",
                        "Comprehensive health and wellness benefits",
                      ].map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                          viewport={{ once: true }}
                          className="flex items-start gap-4 group"
                        >
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: 360 }}
                            transition={{ duration: 0.4 }}
                            className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0 shadow-sm"
                          />
                          <span className="text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                            {item}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* CTA Section */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 text-white text-center relative overflow-hidden  max-w-7xl mx-auto">
            {/* Golden Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>

            <CardContent className="pt-12 pb-12">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Join Our Team?
              </h2>
              <p className="text-slate-300 mb-8 max-w-2xl mx-auto text-lg">
                Send us your resume and cover letter to start your journey with
                Futuretek Institute
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold px-8 py-3">
                    Apply Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="border-white text-black hover:text-white hover:bg-transparent  font-semibold px-8 py-3 transition-all duration-300"
                >
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
