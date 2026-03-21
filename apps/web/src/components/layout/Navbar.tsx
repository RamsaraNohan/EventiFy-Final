import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, UserCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { getSocket } from '../../lib/socket';
import { api } from '../../lib/api';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Fetch initial unread count
      api.get('/notifications').then(res => {
        setUnreadCount(res.data.unreadCount);
      }).catch(err => console.error(err));

      // Listen for real-time notifications
      const socket = getSocket();
      if (socket) {
        socket.on('notification:new', (notification) => {
          setUnreadCount(prev => prev + 1);
          // In a real app we might show a toast here
        });
      }
    }

    return () => {
      const socket = getSocket();
      if (socket) socket.off('notification:new');
    };
  }, [user]);

  return (
    <nav className="glass-panel sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                <span className="text-white font-bold text-lg leading-none">E</span>
              </div>
              <span className="text-2xl font-black tracking-tighter neon-text">EventiFy</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-400 bg-primary-400/10 px-2 py-1 rounded-full border border-primary-500/20">{user.role}</span>
                <Link to="/notifications" className="relative p-2 text-slate-300 hover:text-white transition-colors duration-200">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-600 text-[10px] font-bold text-white shadow-[0_0_5px_rgba(236,72,153,0.8)]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="flex items-center space-x-2 text-slate-200 bg-white/5 pl-2 pr-4 py-1.5 rounded-full border border-white/10">
                  <UserCircle className="h-6 w-6 text-primary-400" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-accent-400 transition"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex space-x-4 items-center">
                <Link to="/login" className="text-slate-300 hover:text-white px-3 py-2 font-medium transition-colors">Login</Link>
                <Link to="/register" className="neon-button text-sm py-2 px-5">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
