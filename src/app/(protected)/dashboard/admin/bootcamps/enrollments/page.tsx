"use client"
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Award, 
  Search, 
  ChevronRight,
  Download,
  RefreshCw,
  Building,
  BarChart3,
  Clock,
  BookOpen,
  GraduationCap
} from 'lucide-react';

interface Student {
  name: string;
  email: string;
}

interface Bootcamp {
  title: string;
  slug: string;
}

interface Enrollment {
  id: string;
  student: Student;
  bootcamp: Bootcamp;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  progress: number;
  enrolledAt: string;
  completedAt?: string;
  college?: string;
}

interface StatusItem {
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  count: number;
  percentage: number;
}

interface BootcampItem {
  id: string;
  title: string;
  slug: string;
  enrollments: number;
  college?: string;
}

interface Stats {
  summary: {
    totalEnrollments: number;
    completionRate: number;
    activeEnrollments: number;
    completedEnrollments: number;
    averageProgress: number;
  };
  statusBreakdown: StatusItem[];
  topBootcamps: BootcampItem[];
  recentEnrollments: Enrollment[];
}

const BootcampStatsPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchBootcampStats();
  }, []);

  const fetchBootcampStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bootcamps/enrollment-stats');
      const data = await response.json();
      if (data.success) {
        // Direct mapping since API response matches UI structure
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching bootcamp stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = stats?.recentEnrollments?.filter(enrollment => {
    const matchesSearch = 
      enrollment.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.bootcamp.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || enrollment.status === filterStatus;
    return matchesSearch && matchesFilter;
  }) || [];

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle,
    color = 'blue'
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    subtitle?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange';
  }) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      purple: 'bg-purple-50 text-purple-600',
      orange: 'bg-orange-50 text-orange-600'
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-2">{title}</p>
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status }: { status: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | string }) => {
    const colors = {
      ACTIVE: 'bg-green-50 text-green-700 border-green-200',
      COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
      DROPPED: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    
    const badgeStatus = status as keyof typeof colors;
    const displayStatus = {
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
      DROPPED: 'Dropped'
    }[badgeStatus] || status;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[badgeStatus] || colors.ACTIVE}`}>
        {displayStatus}
      </span>
    );
  };

  const ProgressBar = ({ progress, showLabel = true }: { progress: number; showLabel?: boolean }) => (
    <div className="flex items-center gap-3">
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            progress >= 70 ? 'bg-green-500' :
            progress >= 40 ? 'bg-blue-500' : 'bg-orange-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 min-w-[40px]">{progress}%</span>
      )}
    </div>
  );

  const StatusDistributionCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Enrollment Status</h2>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      <div className="space-y-4">
        {stats?.statusBreakdown?.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                item.status === 'ACTIVE' ? 'bg-green-500' :
                item.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-gray-400'
              }`} />
              <StatusBadge status={item.status} />
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{item.count}</p>
              <p className="text-sm text-gray-500">{item.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TopBootcampsCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Top Bootcamps</h2>
        <TrendingUp className="w-5 h-5 text-gray-400" />
      </div>
      <div className="space-y-4">
        {stats?.topBootcamps?.slice(0, 5).map((bootcamp, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-600">
                {bootcamp.title}
              </p>
              {bootcamp.college && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  {bootcamp.college}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-semibold text-gray-900">{bootcamp.enrollments}</p>
                <p className="text-xs text-gray-500">enrolled</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
            </div>
          </div>
        ))}
      </div>
      {stats?.topBootcamps && stats.topBootcamps.length > 5 && (
        <button className="w-full mt-4 pt-4 border-t border-gray-200 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1">
          View all {stats.topBootcamps.length} bootcamps
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const CompletionMetricsCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-900">Completion Metrics</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-green-700 font-medium">Active Students</span>
          </div>
          <span className="font-bold text-green-800 text-xl">{stats?.summary?.activeEnrollments || 0}</span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-blue-700 font-medium">Completed</span>
          </div>
          <span className="font-bold text-blue-800 text-xl">{stats?.summary?.completedEnrollments || 0}</span>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.summary?.averageProgress || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <ProgressBar progress={stats?.summary?.averageProgress || 0} showLabel={false} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading bootcamp analytics...</p>
          <p className="text-gray-500 text-sm mt-1">Fetching bootcamp enrollment data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Bootcamp Analytics</h1>
              </div>
              <p className="text-gray-600">Track and analyze bootcamp enrollment patterns and student progress</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchBootcampStats}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-sm shadow-blue-500/25">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Enrollments"
              value={stats?.summary?.totalEnrollments?.toLocaleString() || '0'}
              icon={Users}
              color="blue"
              subtitle={`${stats?.summary?.activeEnrollments || 0} active students`}
            />
            <StatCard
              title="Avg. Progress"
              value={`${stats?.summary?.averageProgress || 0}%`}
              icon={TrendingUp}
              color="green"
              subtitle="Overall bootcamp progress"
            />
            <StatCard
              title="Completion Rate"
              value={`${stats?.summary?.completionRate || 0}%`}
              icon={Award}
              color="purple"
              subtitle="Bootcamp completion rate"
            />
            <StatCard
              title="Bootcamps"
              value={stats?.topBootcamps?.length || 0}
              icon={BookOpen}
              color="orange"
              subtitle="Total bootcamps with enrollments"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Bootcamps Card */}
            <TopBootcampsCard />
            
            {/* Recent Enrollments Preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Recent Enrollments</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  Latest 10 enrollments
                </div>
              </div>
              <div className="space-y-3">
                {stats?.recentEnrollments?.slice(0, 5).map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{enrollment.student.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{enrollment.bootcamp.title}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={enrollment.status} />
                      <span className="text-sm text-gray-600">
                        {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {stats?.recentEnrollments && stats.recentEnrollments.length > 0 && (
                <button className="w-full mt-4 pt-4 border-t border-gray-200 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1">
                  View all {stats.recentEnrollments.length} enrollments
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <StatusDistributionCard />
            <CompletionMetricsCard />
          </div>
        </div>

        {/* Detailed Enrollments Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Bootcamp Enrollments</h2>
                <p className="text-sm text-gray-500 mt-1">Detailed view of all bootcamp enrollments</p>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students or bootcamps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 bg-gray-50"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bootcamp</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">College</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrolled</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEnrollments.slice(0, 10).map((enrollment) => (
                  <tr 
                    key={enrollment.id} 
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-600">
                          {enrollment.student.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">
                          {enrollment.student.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{enrollment.bootcamp.title}</p>
                      <p className="text-xs text-gray-500">{enrollment.bootcamp.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{enrollment.college || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={enrollment.status} />
                    </td>
                    <td className="px-6 py-4">
                      <ProgressBar progress={enrollment.progress} showLabel={false} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round((Date.now() - new Date(enrollment.enrolledAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {enrollment.completedAt ? (
                        <div className="text-sm text-gray-900">
                          {new Date(enrollment.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">In progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-semibold">No enrollments found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {Math.min(filteredEnrollments.length, 10)} of {filteredEnrollments.length} enrollments
                  </p>
                  <div className="flex items-center gap-3">
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      Export Data
                    </button>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                      View all
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Learners</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.summary?.activeEnrollments || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Recently Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.recentEnrollments?.filter(e => e.status === 'COMPLETED').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Popular Bootcamp</p>
                <p className="text-xl font-bold text-gray-900 truncate">
                  {stats?.topBootcamps?.[0]?.title || 'No data'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BootcampStatsPage;