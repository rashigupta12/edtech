import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="py-12 px-4 bg-white">
      <div className=" mx-auto">
        <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl shadow-lg overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative px-6 py-8 md:px-10 md:py-12 text-center">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3 h-3 text-emerald-200" />
              <span className="text-xs font-medium text-white">Limited Time Offer</span>
            </div>

            {/* Heading */}
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Start Your Learning Journey Today
            </h2>
            <p className="text-sm md:text-base text-emerald-100 mb-6 max-w-xl mx-auto">
              Join our community of learners and advance your skills with expert-led courses
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <button className="group bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link href="/courses">
              <button className="bg-transparent border border-white/40 text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200">
                View Courses
              </button>
              </Link>
            </div>

            {/* Features */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs md:text-sm text-emerald-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                <span>No credit card required</span>
              </div>
              <div className="hidden sm:block w-px h-3 bg-emerald-300/40"></div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                <span>Free trial included</span>
              </div>
              <div className="hidden sm:block w-px h-3 bg-emerald-300/40"></div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}