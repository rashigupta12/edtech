import { Award, BookOpen, TrendingUp, Users, CheckCircle } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: BookOpen,
      title: 'Expert-Led Content',
      description: 'Learn from industry professionals with real-world experience',
      points: ['Industry Experts', 'Practical Projects', 'Updated Curriculum'],
      accentColor: 'blue'
    },
    {
      icon: Award,
      title: 'Certified Learning',
      description: 'Earn recognized certificates upon course completion',
      points: ['Industry-Recognized', 'Portfolio Ready', 'Verifiable Credentials'],
      accentColor: 'emerald'
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Connect with peers and mentors in our vibrant community',
      points: ['Peer Learning', 'Mentor Sessions', 'Discussion Forums'],
      accentColor: 'purple'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Access job placement assistance and career resources',
      points: ['Job Placement', 'Career Coaching', 'Networking Events'],
      accentColor: 'amber'
    }
  ];

  const getColorClass = (color: string, type: 'bg' | 'text' | 'border') => {
    const colors = {
      blue: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600',
        border: 'border-blue-200'
      },
      emerald: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600',
        border: 'border-emerald-200'
      },
      purple: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-600',
        border: 'border-purple-200'
      },
      amber: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600',
        border: 'border-amber-200'
      }
    };
    return colors[color as keyof typeof colors][type];
  };

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Features That <span className="relative">
              <span className="relative z-10">Stand Out</span>
              <span className="absolute bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-blue-400/30 to-emerald-400/30 -rotate-1"></span>
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience learning reimagined with our cutting-edge platform features
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative"
            >
              {/* Glass Morphism Card */}
              <div className={`relative backdrop-blur-sm bg-white/70 ${getColorClass(feature.accentColor, 'border')} border rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden`}>
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 ${getColorClass(feature.accentColor, 'bg')} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {/* Floating Icon */}
                <div className="relative mb-6">
                  <div className={`w-14 h-14 ${getColorClass(feature.accentColor, 'bg')} rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300`}>
                    <feature.icon className={getColorClass(feature.accentColor, 'text')} size={28} />
                  </div>
                  <div className={`absolute -top-2 -right-2 w-6 h-6 ${getColorClass(feature.accentColor, 'bg')} rounded-full flex items-center justify-center`}>
                    <span className={`text-xs font-bold ${getColorClass(feature.accentColor, 'text')}`}>+</span>
                  </div>
                </div>
                
                {/* Content */}
                <h3 className={`relative text-xl font-bold text-gray-900 mb-4 group-hover:${getColorClass(feature.accentColor, 'text')} transition-colors`}>
                  {feature.title}
                </h3>
                <p className="relative text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Feature Points */}
                <ul className="relative space-y-3">
                  {feature.points.map((point, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-700">
                      <CheckCircle className={`${getColorClass(feature.accentColor, 'text')}`} size={16} />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Bottom Indicator */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${getColorClass(feature.accentColor, 'bg')} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Connection Lines (Visual Element) */}
        <div className="hidden lg:flex justify-between items-center mt-12 px-12">
          <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-400 to-emerald-400 opacity-30"></div>
          <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-400 to-purple-400 opacity-30"></div>
          <div className="h-0.5 flex-1 bg-gradient-to-r from-purple-400 to-amber-400 opacity-30"></div>
        </div>
      </div>
    </section>
  );
}