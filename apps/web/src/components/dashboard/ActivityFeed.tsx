import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ShoppingBag, CreditCard, MessageSquare, UserPlus, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'booking' | 'payment' | 'message' | 'user_reg';
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get('/admin/activity');
        setActivities(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch activity:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'booking': return <ShoppingBag className="text-blue-500" size={18} />;
      case 'payment': return <CreditCard className="text-emerald-500" size={18} />;
      case 'message': return <MessageSquare className="text-purple-500" size={18} />;
      case 'user_reg': return <UserPlus className="text-amber-500" size={18} />;
      default: return <Clock className="text-gray-400" size={18} />;
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-2 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-400 text-xs font-black uppercase tracking-widest">No recent activity</p>
        </div>
      )}
      {activities.map((item, idx) => {
        if (!item) return null;
        let timeStr = 'Some time ago';
        try {
          if (item.timestamp) {
            timeStr = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
          }
        } catch (e) {
          console.warn('Invalid activity timestamp:', item.timestamp);
        }

        return (
          <div 
            key={item.id || idx} 
            className="group flex gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 animate-in slide-in-from-right-4"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              {getIcon(item.type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between items-start mb-0.5">
                <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{item.title || 'System Action'}</p>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap ml-2">
                  {timeStr}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold leading-relaxed">{item.description || 'Activity logged'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
