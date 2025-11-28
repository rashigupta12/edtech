import { SiteFooter } from '@/components/site-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <>
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-yellow-600 bg-clip-text text-transparent">
            About Futuretek
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-yellow-500 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Bridging ancient wisdom with modern science to empower your life&apos;s journey
          </p>
        </div>

        {/* Vision Card */}
        <Card className="mb-12 border-0 shadow-xl bg-white/80 backdrop-blur-sm relative overflow-hidden">
          {/* Golden Border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-yellow-100 rounded-2xl flex items-center justify-center border border-yellow-200">
              <span className="text-2xl">🌌</span>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-800">Our Vision</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg text-slate-700 leading-relaxed max-w-4xl mx-auto">
              At Futuretek Institute of Astrological Sciences, we envision a world where 
              ancient wisdom and modern science converge to provide profound insights and 
              practical solutions for navigating life&apos;s challenges. Our mission is to 
              empower individuals with the knowledge of KP Astrology, Financial Astrology, 
              Vastu Shastra, and Astro-Vastu, enabling them to make informed decisions 
              and create harmonious environments in both personal and professional spheres.
            </p>
          </CardContent>
        </Card>

        {/* Directors Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-800">
            Our Directors
          </h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Card - Profile */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm group relative overflow-hidden">
              {/* Blue Border */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <CardHeader className="text-center pb-4">
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300 border-4 border-yellow-200">
                  <span className="text-4xl text-white">👨‍💼</span>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">Sunil Dixit</CardTitle>
                <p className="text-blue-600 font-medium">Founder & Director</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-slate-700 leading-relaxed">
                    Sunil Dixit is a distinguished leader in the fields of Vedic Astrology 
                    and Vastu Shastra. As the Founder and Director of the &apos;Futuretek 
                    Institute of Astrological Sciences&apos;, he has dedicated himself to 
                    the advancement and education of these ancient sciences.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    He is a Managing Partner at &apos;SS Techno Vastu&apos;, where his 
                    expertise in software engineering and Vastu Science significantly 
                    influences strategic decision-making in the production of 
                    &apos;Vastuteq software&apos;.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Right Card - Professional Experience */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100/50 group relative overflow-hidden">
              {/* Golden Border */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center border border-yellow-200">
                    <span className="text-xl">💼</span>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800">
                      Professional Experience
                    </CardTitle>
                    <p className="text-yellow-700 font-medium">15+ Years of Excellence</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-slate-700 leading-relaxed">
                      With over <strong className="text-blue-700">15 years of experience</strong> in practicing and teaching 
                      Astrology and Vastu, Sunil Dixit has established himself as a 
                      trusted advisor and mentor in these domains.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      His extensive career includes a notable tenure as a <strong className="text-blue-700">Project Manager</strong> 
                      with a top 10 IT company in Europe, where he successfully managed 
                      projects both in India and overseas.
                    </p>
                  </div>
                  
                  <div className="bg-white/80 rounded-xl p-4 border border-yellow-200">
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <span className="text-yellow-600">🌍</span>
                      International Expertise
                    </h4>
                    <p className="text-slate-700 text-sm">
                      Managed cross-cultural teams and delivered projects across 
                      multiple continents, bringing global perspective to astrological sciences.
                    </p>
                  </div>

                  <div className="bg-white/80 rounded-xl p-4 border border-yellow-200">
                    <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <span className="text-yellow-600">🎓</span>
                      Teaching & Mentorship
                    </h4>
                    <p className="text-slate-700 text-sm">
                      Dedicated to educating the next generation of astrologers and 
                      Vastu consultants through comprehensive training programs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Legal Information */}
     <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 text-white relative overflow-hidden">
  {/* Golden Border */}
  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
  <CardHeader className="text-center pb-4">
    <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center border border-yellow-400/30">
      <span className="text-2xl">⚖️</span>
    </div>
    <CardTitle className="text-3xl font-bold text-white">Legal Information</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <h4 className="font-semibold text-yellow-300 mb-2">Company Name</h4>
          <p className="text-white/90">
            Futuretek Institute of Astrological Sciences Pvt. Ltd.
          </p>
        </div>
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <h4 className="font-semibold text-yellow-300 mb-2">Registration Number</h4>
          <p className="text-white/90">U74999DL2023PTC123456</p>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <h4 className="font-semibold text-yellow-300 mb-2">Registered Address</h4>
          <p className="text-white/90">
            123 Cosmic Lane, Stellar Heights<br />
            New Delhi - 110001, India
          </p>
        </div>
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <h4 className="font-semibold text-yellow-300 mb-2">Contact</h4>
          <p className="text-white/90">+91 98765 43210</p>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

        {/* Values Section */}
        <div className="mt-16">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-800">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Value 1 */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-3 text-lg">Precision</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Accurate astrological calculations and precise Vastu recommendations for optimal results
                </p>
              </CardContent>
            </Card>

            {/* Value 2 */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-200">
                  <span className="text-2xl">🌟</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-3 text-lg">Excellence</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Commitment to highest standards in teaching and astrological practice
                </p>
              </CardContent>
            </Card>

            {/* Value 3 */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="font-bold text-slate-800 mb-3 text-lg">Growth</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Empowering personal and professional growth through astrological wisdom
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    <SiteFooter/>
    </>
  );
}