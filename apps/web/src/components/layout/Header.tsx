import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { getSocket } from '../../lib/socket';
import { api } from '../../lib/api';

export default function Header() {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(res => setUnreadCount(res.data.unreadCount)).catch(console.error);
      const socket = getSocket();
      if (socket) {
        socket.on('notification:new', () => setUnreadCount(prev => prev + 1));
      }
    }
    return () => {
      const socket = getSocket();
      if (socket) socket.off('notification:new');
    };
  }, [user]);

  return (
    <header className="h-20 flex items-center justify-between px-8">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-white/5 rounded-xl leading-5 bg-[#1a1d2d] text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-[#1f2235] focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all sm:text-sm"
            placeholder="Search events, clients..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {user && (
          <Link to="/notifications" className="relative p-2 text-slate-400 hover:text-white transition bg-[#1a1d2d] rounded-full border border-white/5">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
