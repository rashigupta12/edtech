import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { ArrowRight, HelpCircle } from 'lucide-react'

const faqs = [
  {
    question: 'What is KP Astrology?',
    answer: 'KP Astrology, or Krishnamurti Paddhati, is a modern system of astrology that focuses on precise predictions using sub-divisions of houses and planetary positions.',
  },
  {
    question: 'How long are the courses?',
    answer: 'Course durations vary depending on the subject and depth. Typically, our courses range from 4 to 12 weeks, with both part-time and full-time options available.',
  },
  {
    question: 'Are the courses suitable for beginners?',
    answer: 'Yes, we offer courses for all levels, from beginners to advanced practitioners. Each course is designed to provide a solid foundation and progressively build on that knowledge.',
  },
  {
    question: 'Can I apply these learnings professionally?',
    answer: 'Many of our students go on to become professional astrologers, vastu consultants, or use these skills to enhance their existing careers in counseling, real estate, or finance.',
  },
]

export function FAQs() {
  return (
    <section className="py-10 bg-gradient-to-b from-white via-gray-50/40 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 bg-blue-50 text-blue-700 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide uppercase mb-6 shadow-sm">
            <HelpCircle className="h-4 w-4" />
            <span>FAQs</span>
          </div>
          <h2 className="text-4xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-gray-600  mx-auto leading-relaxed">
            Get answers to common questions about our courses and learning methodology
          </p>
        </div>

        {/* FAQ Grid - Left: Questions, Right: CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Left Column - FAQ Questions */}
          <div className="lg:col-span-2">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 overflow-hidden">
                  <AccordionItem value={`item-${index}`} className="border-0">
                    <AccordionTrigger
                      className={cn(
                        "px-6 py-5 text-left font-semibold text-gray-900 hover:text-blue-700 transition-all duration-200",
                        "flex items-start gap-4 data-[state=open]:pb-3 hover:no-underline"
                      )}
                    >
                      {/* <div className="relative flex items-center justify-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                          <span className="text-sm font-bold text-blue-700">
                            {index + 1}
                          </span>
                        </div>
                      </div> */}
                      <span className="flex-1 pr-4 text-base text-left">{faq.question}</span>
                      {/* <ChevronDown className="h-5 w-5 text-gray-400 group-data-[state=open]:rotate-180 group-data-[state=open]:text-blue-600 transition-transform duration-300 flex-shrink-0" /> */}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 text-gray-600 leading-relaxed">
                      <div className="pl-12 pr-4 text-sm">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </div>
              ))}
            </Accordion>
          </div>

          {/* Right Column - Contact CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-2 backdrop-blur-sm">
                    <HelpCircle className="h-7 w-7 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3">
                    Still Have Questions?
                  </h3>
                  <p className="text-blue-100 mb-4 leading-relaxed">
                    Our support team is here to help you find the perfect course for your journey into astrology and ancient sciences.
                  </p>

                  {/* CTA Button */}
                  <a
                    href="/contact"
                    className="group flex items-center justify-center gap-2 bg-white text-blue-700 px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 w-full"
                  >
                    Contact Support
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}