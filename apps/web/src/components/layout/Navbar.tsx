import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { getSocket } from '../../lib/socket';
import { api } from '../../lib/api';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      api.get('/notifications')
        .then(res => setUnreadCount(res.data.unreadCount || 0))
        .catch(() => {});

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleBadge: Record<string, { label: string; color: string }> = {
    CLIENT: { label: 'Client', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    VENDOR_OWNER: { label: 'Vendor', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    ADMIN: { label: 'Admin', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  };
  const badge = user ? (roleBadge[user.role] || { label: user.role, color: 'bg-white/10 text-white border-white/10' }) : null;

  const avatarSrc = user?.avatarUrl?.startsWith('http') ? user.avatarUrl : user?.avatarUrl ? `http://localhost:8000${user.avatarUrl}` : null;

  return (
    <nav className="glass-panel sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.5)]">
              <span className="text-white font-bold text-lg leading-none">E</span>
            </div>
            <span className="text-2xl font-black tracking-tighter neon-text">EventiFy</span>
          </Link>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Role Badge */}
                {badge && (
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                )}

                {/* Notifications */}
                <Link to="/notifications" onClick={() => setUnreadCount(0)}
                  className="relative p-2 text-slate-300 hover:text-white transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-[0_0_6px_rgba(239,68,68,0.8)]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setDropdownOpen(v => !v)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 pl-1 pr-3 py-1 rounded-full border border-white/10 transition-all">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary-600/40 flex items-center justify-center text-primary-300 text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-200">{user.name}</span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#141724] border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden">
                      <Link to="/settings" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      <Link to="/notifications" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                        <Bell className="w-4 h-4" /> Notifications
                      </Link>
                      <div className="border-t border-white/5 mt-1 pt-1">
                        <button onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-colors">
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
