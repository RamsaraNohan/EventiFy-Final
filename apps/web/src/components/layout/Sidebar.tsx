import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Ticket, Users, Megaphone, Settings, UserCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 glass-panel border-r border-white/5 h-screen sticky top-0 flex flex-col pt-6 pb-4">
      <div className="px-6 mb-8 flex items-center space-x-3">
        <div className="w-8 h-8 rounded border border-primary-500/50 bg-primary-500/20 flex items-center justify-center">
          <span className="text-primary-400 font-bold text-xl leading-none">E</span>
        </div>
        <span className="text-xl font-bold text-white tracking-wide">EventiFy</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Dashboard
        </NavLink>
        <NavLink to="/events" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <CalendarDays className="w-5 h-5 mr-3" />
          Events
        </NavLink>
        <NavLink to="/bookings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Ticket className="w-5 h-5 mr-3" />
          Bookings
        </NavLink>
        <NavLink to="/attendees" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users className="w-5 h-5 mr-3" />
          Attendees
        </NavLink>
        <NavLink to="/marketing" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Megaphone className="w-5 h-5 mr-3" />
          Marketing
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </NavLink>
      </nav>

      {user ? (
        <div className="px-4 mt-auto">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-600/30 flex flex-shrink-0 items-center justify-center text-primary-300">
                <UserCircle className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.role}</p>
              </div>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors p-1">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 mt-auto text-center">
          <NavLink to="/login" className="text-sm text-primary-400 hover:text-primary-300">Log in</NavLink>
        </div>
      )}
    </aside>
  );
}
