import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { getSocket } from '../../lib/socket';
import { api } from '../../lib/api';
import ThemeToggle from '../ui/ThemeToggle';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
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
    <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-surface-card border-b border-border-main transition-colors duration-300">
      {/* Mobile Menu Toggle */}
      <button 
        onClick={onMenuClick}
        className="lg:hidden p-3 bg-surface-muted rounded-2xl border border-border-main mr-4 text-text-muted hover:text-brand-600 transition-all active:scale-90"
      >
        <Menu size={20} />
      </button>

      {/* Search Bar Trigger */}
      <div className="flex-1 max-w-xl">
        <div 
          onClick={() => {
            // Trigger focus by simulating Ctrl+K or just using a CustomEvent if I had a listener
            // For now, OmniSearch listens to Ctrl+K globally, but we can also trigger it via window event
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
          }}
          className="relative group cursor-pointer"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
          </div>
          <div className="w-full pl-11 pr-4 py-3 border border-gray-100 rounded-[1.25rem] bg-gray-50/50 text-gray-400 text-xs font-black uppercase tracking-widest flex items-center justify-between group-hover:bg-white group-hover:border-gray-200 transition-all shadow-sm">
            <span>Search Platform...</span>
            <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
               <kbd className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[9px]">CTRL</kbd>
               <kbd className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[9px]">K</kbd>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <ThemeToggle />
        {user && (
          <Link to="/notifications" className="relative p-3 text-text-muted hover:text-brand-600 transition bg-surface-muted hover:bg-surface-card rounded-2xl border border-border-main shadow-sm h-11 w-11 flex items-center justify-center">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg border-2 border-surface-card">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
