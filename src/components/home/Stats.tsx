import { Award, BookOpen, TrendingUp, Users } from "lucide-react";

export default function Stats() {
  const stats = [
    { icon: Users, value: '50,000+', label: 'Active Learners' },
    { icon: BookOpen, value: '500+', label: 'Expert Courses' },
    { icon: Award, value: '95%', label: 'Completion Rate' },
    { icon: TrendingUp, value: '4.8/5', label: 'Average Rating' }
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <stat.icon className="text-green-700" size={32} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};