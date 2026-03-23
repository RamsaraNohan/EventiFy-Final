import React, { useState, useEffect } from 'react';
import { DollarSign, Ticket, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../../lib/api';
import { format } from 'date-fns';
import { getSocket } from '../../../lib/socket';
import { VENDOR_CATEGORIES, CITIES } from '../../../lib/constants';

export default function VendorDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({ businessName: '', category: 'Photography', city: '', basePrice: '' });

  useEffect(() => {
    fetchProfile();
    fetchBookings();
    fetchMetrics();

    const socket = getSocket();
    if (socket) {
      socket.on('payment:success', fetchMetrics);
      socket.on('notification:new', fetchBookings);
      return () => {
        socket.off('payment:success', fetchMetrics);
        socket.off('notification:new', fetchBookings);
      };
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/vendors/me');
      setVendorProfile(res.data);
      if (!res.data) setShowSetup(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/vendors', {
        ...setupForm,
        basePrice: parseFloat(setupForm.basePrice)
      });
      setVendorProfile(res.data);
      setShowSetup(false);
      fetchMetrics();
    } catch (err) {
      console.error(err);
      alert('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/vendor');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/vendors/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;

  if (showSetup) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="glass-panel p-10 space-y-8 border-primary-500/20 shadow-[0_0_50px_rgba(33,150,243,0.1)]">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 bg-primary-500/10 rounded-3xl flex items-center justify-center mx-auto text-primary-400 mb-6 border border-primary-500/20">
              <TrendingUp className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Complete Your Profile</h1>
            <p className="text-slate-400 text-lg">Initialize your business presence on EventiFy to start receiving bookings.</p>
          </div>

          <form onSubmit={handleCreateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Business Name</label>
                <input 
                  required
                  value={setupForm.businessName}
                  onChange={e => setSetupForm({...setupForm, businessName: e.target.value})}
                  className="input-futuristic" 
                  placeholder="e.g. Neon Nights Photography"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Category</label>
                <select 
                  value={setupForm.category}
                  onChange={e => setSetupForm({...setupForm, category: e.target.value})}
                  className="input-futuristic [&>option]:bg-slate-900"
                >
                  {VENDOR_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">City</label>
                <select 
                  required
                  value={setupForm.city}
                  onChange={e => setSetupForm({...setupForm, city: e.target.value})}
                  className="input-futuristic [&>option]:bg-slate-900"
                >
                  <option value="">Select City</option>
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-widest">Base Price (LKR)</label>
                <input 
                  required
                  type="number"
                  value={setupForm.basePrice}
                  onChange={e => setSetupForm({...setupForm, basePrice: e.target.value})}
                  className="input-futuristic" 
                  placeholder="50000"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 neon-button text-lg">
              {loading ? 'INITIALIZING...' : 'START YOUR BUSINESS'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const upcomingEvents = bookings
    .filter(b => b.status === 'APPROVED' && b.event?.date && new Date(b.event.date) >= new Date())
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Vendor Console</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your services, track earnings, and review incoming requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="glass-panel p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/20 rounded-full blur-[50px] pointer-events-none" />
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Your Profile</h2>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 flex items-center justify-center text-white font-black text-2xl shadow-lg border border-white/10">
              {vendorProfile?.businessName?.charAt(0) || 'V'}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{vendorProfile?.businessName || 'Loading...'}</h3>
              <p className="text-primary-400 text-sm font-medium">{vendorProfile?.category || 'Vendor'}</p>
            </div>
          </div>
          <div className="space-y-3 border-t border-white/5 pt-4 text-sm">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Location</span>
              <span>{vendorProfile?.city || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Base Price</span>
              <span className="font-mono">LKR {vendorProfile?.basePrice?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Status</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3 h-3" /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Group */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard 
            label="Total Earnings" 
            value={`LKR ${metrics?.totalEarnings?.toLocaleString() || 0}`} 
            icon={DollarSign} 
            trend="+12% this month"
          />
          <MetricCard 
            label="Active Bookings" 
            value={bookings.filter(b => b.status === 'APPROVED').length || 0} 
            icon={CheckCircle} 
          />
          <MetricCard 
            label="Pending Inquiries" 
            value={pendingCount} 
            icon={Clock} 
          />
          <MetricCard 
            label="Events Completed" 
            value={metrics?.completedEvents || 0} 
            icon={Ticket} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-primary-400" />
              Upcoming Events
            </h2>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <p className="text-slate-500 text-sm">Loading events...</p>
            ) : upcomingEvents.length === 0 ? (
              <div className="p-6 text-center border border-white/5 bg-white/5 rounded-xl">
                <p className="text-slate-500 text-sm mb-2">No upcoming scheduled events.</p>
                <p className="text-xs text-slate-600">Ensure your profile is complete to get discovered.</p>
              </div>
            ) : (
              upcomingEvents.map((ev: any) => (
                <div key={ev.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center group hover:bg-white/10 transition-all">
                  <div className="mb-3 sm:mb-0">
                    <h3 className="text-white font-medium text-sm group-hover:text-primary-300 transition-colors">{ev.event?.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center">
                      User: {ev.event?.client?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-lg border border-primary-500/20">
                      {format(new Date(ev.event?.date), 'MMM d, yyyy')}
                    </p>
                    {ev.agreedCost && <p className="text-[10px] text-slate-500 mt-1 font-mono tracking-widest uppercase">LKR {ev.agreedCost.toLocaleString()}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Analytics Snapshot */}
        <div className="glass-panel p-6 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary-400" />
            Event Progress
          </h2>
          <div className="flex-1 bg-gradient-to-bl from-white/5 to-transparent border border-white/5 rounded-xl flex flex-col items-center justify-center p-6 text-slate-500 text-sm">
            <div className="w-24 h-24 rounded-full border-4 border-white/10 border-t-primary-500 mb-4 animate-spin-slow"></div>
            <p className="font-semibold text-white/70">Connecting Analytics Engine...</p>
            <p className="text-xs mt-1 text-center max-w-[200px]">Historical data charting will be available after your first 5 events.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend }: any) {
  return (
    <div className="glass-panel p-5 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/10 rounded-full blur-xl group-hover:bg-primary-500/20 transition-all" />
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <div className="mt-2 flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-white">{value}</p>
            {trend && <span className="text-xs font-semibold text-green-400">{trend}</span>}
          </div>
        </div>
        <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-primary-400">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

const CalendarIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
