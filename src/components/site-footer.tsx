import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  GraduationCap,
  Users,
  ChevronRight
} from "lucide-react";
import Link from "next/link";


export function SiteFooter() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-2xl text-white"> EduTech</h3>
                <p className="text-sm text-emerald-400 font-medium">Learn & Grow</p>
              </div>
            </div>
            <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-md">
              Empowering learners worldwide with cutting-edge educational technology. 
              Access thousands of courses, interactive content, and expert-led programs 
              to accelerate your learning journey.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Facebook, href: "#", label: "Facebook", color: "hover:bg-blue-600" },
                { icon: Instagram, href: "#", label: "Instagram", color: "hover:bg-pink-600" },
                { icon: Twitter, href: "#", label: "Twitter", color: "hover:bg-blue-500" },
                { icon: Youtube, href: "#", label: "YouTube", color: "hover:bg-red-600" },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className={`w-10 h-10 bg-gray-800 ${social.color} text-gray-300 hover:text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-105`}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-6 text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Resources
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/courses", label: "All Courses" },
                { href: "/instructors", label: "Expert Instructors" },
                { href: "/pricing", label: "Pricing Plans" },
                { href: "/enterprise", label: "For Organizations" },
                { href: "/certifications", label: "Certifications" },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-gray-400 hover:text-emerald-400 transition-colors duration-200 text-sm flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-6 text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Company
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "About Us" },
                { href: "/careers", label: "Careers" },
                { href: "/blog", label: "Blog & Insights" },
                { href: "/contact", label: "Contact Support" },
                { href: "/legal", label: "Legal & Privacy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-gray-400 hover:text-emerald-400 transition-colors duration-200 text-sm flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-6 text-lg">
              Get in Touch
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <a
                    href="mailto:support@ EduTech.com"
                    className="text-gray-300 hover:text-emerald-400 transition-colors text-sm"
                  >
                    support@ EduTech.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <a href="tel:+11234567890" className="text-gray-300 hover:text-emerald-400 transition-colors text-sm">
                    +1 (123) 456-7890
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <span className="text-gray-300 text-sm leading-relaxed">
                    123 Learning Street<br />
                    San Francisco, CA 94107
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

       
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-900">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-gray-500 text-sm text-center md:text-left">
              &copy; {new Date().getFullYear()}  EduTech LMS. All rights reserved.
            </div>
            
            {/* Additional Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-emerald-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-emerald-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-500 hover:text-emerald-400 transition-colors">
                Cookie Policy
              </Link>
              <Link href="/sitemap" className="text-gray-500 hover:text-emerald-400 transition-colors">
                Sitemap
              </Link>
            </div>
            
            {/* Trust Badges */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>SSL Secured</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}