import {
  Mail,

  MapPin,
  MessageSquare,
  Clock,
 
  CheckCircle,
  Users,
  Headphones,
  BookOpen,
  Send,

  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SiteFooter } from "@/components/site-footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="pt-12 pb-8 md:pt-16 md:pb-12 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-5 py-2.5 rounded-full mb-6">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">We&apos;re Here to Help</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Get in <span className="text-emerald-600">Touch</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed">
              Have questions about our platform, courses, or enterprise
              solutions? Our dedicated team is ready to assist you on your
              learning journey.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Email Card */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600 text-sm mb-4">
                Send us an email for general inquiries or support requests.
              </p>
              <div className="space-y-1">
                <a
                  href="mailto:support@edusphere.com"
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-base block"
                >
                  support@edusphere.com
                </a>
                <a
                  href="mailto:sales@edusphere.com"
                  className="text-gray-600 hover:text-emerald-600 font-medium text-sm block"
                >
                  sales@edusphere.com
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Typically replies within 24 hours
              </p>
            </div>

            {/* Phone Card */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                <Headphones className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600 text-sm mb-4">
                Speak directly with our support or sales team.
              </p>
              <div className="space-y-1">
                <a
                  href="tel:+11234567890"
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-base block"
                >
                  +1 (123) 456-7890
                </a>
                <a
                  href="tel:+18005551234"
                  className="text-gray-600 hover:text-emerald-600 font-medium text-sm block"
                >
                  +1 (800) 555-1234
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                <Clock className="w-3 h-3" />
                <span>Mon-Fri, 9AM-6PM EST</span>
              </div>
            </div>

            {/* Visit Card */}
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Visit Us</h3>
              <p className="text-gray-600 text-sm mb-4">
                Our headquarters and learning center location.
              </p>
              <address className="not-italic">
                <p className="text-gray-700 text-sm leading-relaxed">
                  123 Learning Street
                  <br />
                  San Francisco, CA 94107
                  <br />
                  United States
                </p>
              </address>
             
            </div>
          </div>

          {/* Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Send us a Message
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Fill out the form below and we&apos;ll get back to you as soon as
                possible. Let us know how we can help with your learning needs.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      24/7 Support
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Our support team is available round the clock to assist
                      you.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      Expert Guidance
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Get personalized recommendations for your learning path.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">
                      Global Community
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Connect with learners and instructors worldwide.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-8 shadow-lg border border-gray-100">
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="John"
                      className="h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="Doe"
                      className="h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    className="h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Type *
                  </label>
                  <select className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-emerald-500 bg-white">
                    <option value="">Select an option</option>
                    <option value="support">Technical Support</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="billing">Billing Question</option>
                    <option value="course">Course Information</option>
                    <option value="enterprise">Enterprise Solutions</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <Textarea
                    placeholder="Tell us how we can help you..."
                    className="min-h-[120px] border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    By submitting this form, you agree to our Privacy Policy and
                    consent to being contacted by EduSphere about our
                    educational services.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white h-12 text-lg font-semibold"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter/>
    </div>
  );
}
