'use client';

import { Clock, FileText, Gavel, DollarSign, TrendingUp } from 'lucide-react';

interface Activity {
  id: number;
  type: string;
  description: string;
  time: string;
}

interface RecentActivityProps {
  activities: Activity[];
  loading: boolean;
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'case_filed':
        return FileText;
      case 'judgment':
        return Gavel;
      case 'settlement':
        return DollarSign;
      default:
        return TrendingUp;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'case_filed':
        return 'text-blue-400 bg-blue-500/20';
      case 'judgment':
        return 'text-purple-400 bg-purple-500/20';
      case 'settlement':
        return 'text-green-400 bg-green-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-4 p-4 glass rounded-xl animate-pulse">
            <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      </div>
      
      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div 
                key={activity.id} 
                className="flex items-start space-x-4 p-4 glass rounded-xl hover:bg-white/10 transition-all duration-200 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`p-2 rounded-lg ${colorClass} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors duration-200">
                    {activity.description}
                  </p>
                  <div className="flex items-center mt-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {activity.time}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}