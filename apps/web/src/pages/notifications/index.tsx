import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    api.get('/notifications').then(res => {
      setNotifications(res.data.notifications);
    });
  }, []);

  const markAllRead = async () => {
    await api.post('/notifications/mark-all-read');
    setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Transmission <span className="neon-text">Log</span></h1>
        <button 
          onClick={markAllRead}
          className="text-xs font-bold tracking-widest uppercase bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-all shadow-[0_0_10px_rgba(255,255,255,0.05)] focus:ring-1 focus:ring-white/30"
        >
          Acknowledge All
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No active transmissions detected.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {notifications.map((notif) => (
              <li key={notif.id} className={`p-5 transition-all duration-300 hover:bg-white/5 ${!notif.readAt ? 'bg-primary-900/20 border-l-2 border-l-primary-500' : 'border-l-2 border-l-transparent'}`}>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${!notif.readAt ? 'text-white' : 'text-slate-300'}`}>{notif.title}</p>
                    <p className="text-sm text-slate-400 mt-1">{notif.body}</p>
                    <p className="text-xs text-primary-400/80 font-mono mt-3">{new Date(notif.createdAt).toLocaleString()}</p>
                  </div>
                  {!notif.readAt && (
                    <div className="flex-shrink-0 flex items-center">
                      <span className="h-2 w-2 bg-accent-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)] animate-pulse"></span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
