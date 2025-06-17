'use client';

import { FileText, CheckCircle, DollarSign, Clock } from 'lucide-react';

interface Stats {
  totalCases: number;
  totalSettlements: string;
  activeJudges: number;
  avgResolutionTime: string;
  successRate: string;
  pendingCases: number;
}

interface StatsGridProps {
  stats?: Stats;
  loading: boolean;
}

export function StatsGrid({ stats, loading }: StatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-panel p-6 animate-pulse">
            <div className="h-8 bg-white/10 rounded mb-2"></div>
            <div className="h-12 bg-white/10 rounded mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Cases',
      value: stats?.totalCases.toLocaleString() || '0',
      change: '+12%',
      trend: 'up' as const,
      icon: FileText,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Total Settlements',
      value: stats?.totalSettlements || '$0',
      change: '+23%',
      trend: 'up' as const,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Success Rate',
      value: stats?.successRate || '0%',
      change: '+2.1%',
      trend: 'up' as const,
      icon: CheckCircle,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Avg Resolution',
      value: stats?.avgResolutionTime || '0 days',
      change: '-15%',
      trend: 'down' as const,
      icon: Clock,
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <div key={stat.title} className="glass-panel p-6 group transition-all duration-300 hover:scale-105 hover:border-blue-500/50" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className={`text-sm font-semibold ${
              stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {stat.change}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
            <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform duration-300">
              {stat.value}
            </p>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            {stat.trend === 'up' ? '↗' : '↘'} from last month
          </div>
        </div>
      ))}
    </div>
  );
}