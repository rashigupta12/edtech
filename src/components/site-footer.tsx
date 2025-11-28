import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Star,
  
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Futuretek</h3>
                <p className="text-sm text-blue-200">Institute of Astrological Sciences</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Master ancient wisdom with modern teaching methodologies. Expert-led courses 
              in KP Astrology, Financial Astrology, Vastu Shastra, and Astro-Vastu.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Facebook, href: "#", color: "hover:text-blue-400" },
                { icon: Instagram, href: "#", color: "hover:text-pink-400" },
                { icon: Twitter, href: "#", color: "hover:text-blue-300" },
                { icon: Youtube, href: "#", color: "hover:text-red-400" },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className={`text-slate-400 ${social.color} transition-colors duration-200`}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/courses", label: "All Courses" },
                { href: "/about", label: "About Institute" },
                { href: "/contact", label: "Contact Us" },
                { href: "/blogs", label: "Blog" },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-slate-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">
              Contact Info
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <a
                    href="mailto:info@futuretekastro.com"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    info@futuretekastro.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <a href="tel:+919876543210" className="text-slate-400 hover:text-white transition-colors text-sm">
                    +91 98765 43210
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 text-sm leading-relaxed">
                    New Delhi - 110001, India
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">
              Newsletter
            </h3>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Get astrological insights and course updates.
            </p>
            <form className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 h-10"
                required
              />
              <Button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white h-10 font-medium transition-colors duration-200"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-slate-400 text-sm">
              &copy; 2024 Futuretek Institute. All rights reserved.
            </div>
            
            
          </div>
        </div>
      </div>
    </footer>
  );
}