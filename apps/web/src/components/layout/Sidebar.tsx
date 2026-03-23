import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Ticket, Users, Megaphone, Settings,
  LogOut, MessageSquare, ShieldCheck, Search, Sparkles, ListChecks,
  Bell, TrendingUp, X
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import UnreadBadge from '../ui/UnreadBadge';
import { Avatar } from '../ui/Avatar';
import { getSocket } from '../../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all gap-3 ${
    isActive
      ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
  }`;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [unread, setUnread] = useState({ messages: 0, notifications: 0 });

  useEffect(() => {
    if (!user) return;
    
    const fetchCounts = async () => {
      try {
        const [mRes, nRes] = await Promise.all([
          api.get('/conversations/unread-count'),
          api.get('/notifications/unread-count')
        ]);
        setUnread({ messages: mRes.data.unreadCount, notifications: nRes.data.unreadCount });
      } catch (err) {
        // silently fail
      }
    };
    
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    const handleNewMsg = (msg: any) => {
      if (msg.senderUserId !== user.id) {
        setUnread(prev => ({ ...prev, messages: prev.messages + 1 }));
      }
    };
    const handleNewNotif = () => {
      setUnread(prev => ({ ...prev, notifications: prev.notifications + 1 }));
    };

    socket.on('message:new', handleNewMsg);
    socket.on('notification:new', handleNewNotif);

    return () => {
      socket.off('message:new', handleNewMsg);
      socket.off('notification:new', handleNewNotif);
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = (
    <aside className="w-64 bg-[#0d0f1a] border-r border-white/5 h-full flex flex-col pb-4">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg leading-none">E</span>
          </div>
          <span className="text-xl font-black text-white tracking-wide">EventiFy</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {/* Dashboard - all roles */}
        <NavLink to="/dashboard" className={linkCls} onClick={onClose}>
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          Dashboard
        </NavLink>

        <div className="pt-3 pb-1 px-3">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            {user?.role === 'CLIENT' ? 'My Events' : user?.role === 'VENDOR_OWNER' ? 'My Work' : 'Management'}
          </span>
        </div>

        {/* CLIENT */}
        {user?.role === 'CLIENT' && (
          <>
            <NavLink to="/events" className={linkCls} onClick={onClose}>
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              My Events
            </NavLink>
            <NavLink to="/explore" className={linkCls} onClick={onClose}>
              <Search className="w-4 h-4 flex-shrink-0" />
              Explore Vendors
            </NavLink>
            <NavLink to="/recommendations" className={linkCls} onClick={onClose}>
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              AI Suggestions
            </NavLink>
            <NavLink to="/transactions" className={linkCls} onClick={onClose}>
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              Transactions
            </NavLink>
          </>
        )}

        {/* VENDOR */}
        {user?.role === 'VENDOR_OWNER' && (
          <>
            <NavLink to="/services" className={linkCls} onClick={onClose}>
              <ListChecks className="w-4 h-4 flex-shrink-0" />
              My Services
            </NavLink>
            <NavLink to="/bookings" className={linkCls} onClick={onClose}>
              <Ticket className="w-4 h-4 flex-shrink-0" />
              Booking Requests
            </NavLink>
            <NavLink to="/calendar" className={linkCls} onClick={onClose}>
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              Availability
            </NavLink>
            <NavLink to="/marketing" className={linkCls} onClick={onClose}>
              <Megaphone className="w-4 h-4 flex-shrink-0" />
              Analytics
            </NavLink>
            <NavLink to="/transactions" className={linkCls} onClick={onClose}>
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              Earnings
            </NavLink>
          </>
        )}

        {/* ADMIN */}
        {user?.role === 'ADMIN' && (
          <>
            <NavLink to="/users" className={linkCls} onClick={onClose}>
              <Users className="w-4 h-4 flex-shrink-0" />
              User Database
            </NavLink>
            <NavLink to="/approvals" className={linkCls} onClick={onClose}>
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              Vendor Approvals
            </NavLink>
            <NavLink to="/events" className={linkCls} onClick={onClose}>
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              All Events
            </NavLink>
            <NavLink to="/transactions" className={linkCls} onClick={onClose}>
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              Transactions
            </NavLink>
          </>
        )}

        {/* Universal */}
        <div className="pt-3 pb-1 px-3">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Communication</span>
        </div>
        <NavLink to="/messages" className={(props) => `${linkCls(props)} relative`} onClick={() => { setUnread(p => ({...p, messages: 0})); onClose(); }}>
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          Messages
          <UnreadBadge count={unread.messages} />
        </NavLink>
        <NavLink to="/notifications" className={(props) => `${linkCls(props)} relative`} onClick={() => { setUnread(p => ({...p, notifications: 0})); onClose(); }}>
          <Bell className="w-4 h-4 flex-shrink-0" />
          Notifications
          <UnreadBadge count={unread.notifications} />
        </NavLink>
        <NavLink to="/settings" className={linkCls} onClick={onClose}>
          <Settings className="w-4 h-4 flex-shrink-0" />
          Settings
        </NavLink>
      </nav>

      {/* User Card */}
      {user && (
        <div className="px-3 mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar 
                src={user.avatarUrl} 
                name={user.name} 
                size="sm" 
                className="rounded-xl flex-shrink-0" 
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">
                  {user.role.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1 ml-1 flex-shrink-0" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0">
        {SidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={onClose}
               className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: 0 }}
               exit={{ x: '-100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-y-0 left-0 z-[101] lg:hidden shadow-2xl"
            >
               {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
