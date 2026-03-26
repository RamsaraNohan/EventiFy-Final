import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { Bell, MessageSquare, CalendarCheck, CheckCircle, CreditCard, FileText, Briefcase, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { formatRelative } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}


const getIconForType = (type: string) => {
  switch (type) {
    case 'NEW_MESSAGE': return <MessageSquare className="w-5 h-5 text-brand-600" />;
    case 'BOOKING_REQUEST': 
    case 'NEW_BOOKING_REQUEST': return <CalendarCheck className="w-5 h-5 text-amber-500" />;
    case 'BOOKING_UPDATE': return <FileText className="w-5 h-5 text-blue-500" />;
    case 'VENDOR_APPROVED': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    case 'PAYMENT_REQUIRED': return <CreditCard className="w-5 h-5 text-rose-500" />;
    case 'NEW_TASK': 
    case 'TASK_UPDATED': return <Briefcase className="w-5 h-5 text-indigo-500" />;
    default: return <Bell className="w-5 h-5 text-gray-400" />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    if (socket) {
      socket.on('notification', fetchNotifications);
      return () => {
        socket.off('notification', fetchNotifications);
      }
    }
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
                 <Bell size={20} />
              </div>
              <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em]">Operational Inbox</span>
           </div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">Intelligence Feed</h1>
           <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Real-time collaboration and system updates</p>
        </div>
        
        {notifications.some(n => !n.readAt) && (
          <button 
            onClick={markAllRead}
            className="flex items-center gap-3 text-[10px] font-black tracking-widest uppercase bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-gray-200 active:scale-95"
          >
            <CheckCircle className="w-4 h-4" />
            Clear All Unread
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-8 flex gap-6 animate-pulse">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-4">
                  <div className="h-4 bg-gray-50 w-1/4 rounded-lg" />
                  <div className="h-3 bg-gray-50 w-3/4 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-[2rem] flex items-center justify-center mb-6 border border-gray-100 shadow-inner">
                <Sparkles size={40} />
             </div>
             <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Stream is Clear</h3>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">No operational updates detected at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            <AnimatePresence initial={false}>
              {notifications.map((notif, idx) => {
                const unread = !notif.readAt;
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={notif.id} 
                    className={`p-8 transition-all duration-300 hover:bg-gray-50 group relative ${unread ? 'bg-brand-50/10' : ''}`}
                  >
                    <div className="flex gap-6">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${unread ? 'bg-white border-brand-200 shadow-md shadow-brand-100 scale-110' : 'bg-gray-50 border-gray-100'}`}>
                        {getIconForType(notif.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <h4 className={`text-md font-black uppercase tracking-tight ${unread ? 'text-gray-900' : 'text-gray-500'}`}>{notif.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                            <Clock size={12} className="text-brand-500" />
                            {formatRelative(new Date(notif.createdAt), new Date())}
                          </div>
                        </div>
                        <p className={`text-sm tracking-tight leading-relaxed ${unread ? 'text-gray-600 font-medium' : 'text-gray-400 font-normal'}`}>{notif.body}</p>
                        
                        {unread && (
                           <div className="mt-4 flex items-center gap-2">
                              <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest py-1 px-3 bg-brand-50 border border-brand-100 rounded-lg">Pending Intelligence</span>
                           </div>
                        )}
                      </div>

                      {unread && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-brand-600 rounded-r-full shadow-[2px_0_10px_rgba(139,92,246,0.5)]" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-gray-200 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 opacity-10 rounded-full blur-3xl -z-10" />
         <div className="space-y-2 text-center md:text-left">
            <h4 className="font-black text-lg uppercase tracking-tight">Need Assistance?</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Connect with our support squad for institutional guidance.</p>
         </div>
         <button className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-50 transition-all flex items-center gap-3 active:scale-95 shadow-xl shadow-black/20">
            Open Support Stream <ArrowRight size={16} />
         </button>
      </div>
    </div>
  );
}
