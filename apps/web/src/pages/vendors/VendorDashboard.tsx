import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Calendar, CheckSquare, Star, DollarSign, TrendingUp, MapPin, Building2, Wallet, ArrowRight, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VENDOR_CATEGORIES, CITIES } from '../../lib/constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { KpiCard } from '../../components/ui/KpiCard';
import { fmtLKR } from '../../utils/dateFormat';
import { Avatar } from '../../components/ui/Avatar';

interface DashboardData {
  vendor: any;
  eventVendors: any[];
  metrics: {
    totalEarnings: number;
    upcomingEvents: number;
    pendingTasks: number;
    completedEvents: number;
    averageRating: number;
    monthlyEarnings: { month: string; amount: number }[];
  };
}

export default function VendorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({ 
    businessName: '', 
    category: 'Photography', 
    city: '', 
    basePrice: '',
    description: '',
    services: '',
    bankName: '',
    bankCode: '',
    branchCode: '',
    accountName: '',
    accountNumber: ''
  });

  useEffect(() => { fetchDashboard(); }, [period]);

  const fetchDashboard = async () => {
    try {
      const [vendorRes, eventsRes, metricsRes] = await Promise.all([
        api.get('/vendors/me'),
        api.get('/events/vendor/mine'),
        api.get(`/vendors/metrics?period=${period}`)
      ]);

      const vendor = vendorRes.data;
      if (!vendor) {
        setShowSetup(true);
        setLoading(false);
        return;
      }
      const eventVendors: any[] = eventsRes.data;
      const metricsData = metricsRes.data;

      const now = new Date();
      const upcomingEvents = eventVendors.filter(ev => new Date(ev.event?.date) > now).length;
      const completedEvents = eventVendors.filter(ev => ev.status === 'FULLY_PAID' || ev.status === 'COMPLETED').length;
      const allTasks = eventVendors.flatMap(ev => ev.tasks || []);
      const pendingTasks = allTasks.filter((t: any) => t.status !== 'COMPLETED').length;
      
      setData({
        vendor,
        eventVendors,
        metrics: { 
          totalEarnings: metricsData.totalEarnings || 0,
          upcomingEvents, 
          pendingTasks, 
          completedEvents, 
          averageRating: vendor.averageRating || 0,
          monthlyEarnings: metricsData.chartData || []
        }
      });
      setShowSetup(false);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/vendors', {
        ...setupForm,
        basePrice: parseFloat(setupForm.basePrice) || 0,
        services: setupForm.services.split(',').map(s => s.trim()).filter(s => s !== '')
      });
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert('Failed to create profile. Please try again.');
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8 animate-pulse">
      <div className="h-48 bg-gray-100 rounded-[2.5rem]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i=><div key={i} className="h-36 bg-gray-100 rounded-3xl"/>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 h-96 bg-gray-100 rounded-[2.5rem]" />
         <div className="h-96 bg-gray-100 rounded-[2.5rem]" />
      </div>
    </div>
  );
  
  if (showSetup) return (
    <div className="max-w-3xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white border border-gray-100 p-10 md:p-14 rounded-[3rem] shadow-xl shadow-gray-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[100px] -z-10" />
        
        <div className="text-center space-y-3 mb-12">
          <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-brand-100">
            <Building2 size={40} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Elevate Your Business</h1>
          <p className="text-gray-400 text-lg font-medium">Complete your vendor profile to start reaching thousands of clients.</p>
        </div>

        <form onSubmit={handleCreateProfile} className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Identity *</label>
                <input required value={setupForm.businessName} onChange={e => setSetupForm({...setupForm, businessName: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500 transition-all" placeholder="e.g. Celestial Frames" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expertise Category *</label>
                <select value={setupForm.category} onChange={e => setSetupForm({...setupForm, category: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500 transition-all cursor-pointer">
                  {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">The Story (Description) *</label>
              <textarea 
                required 
                value={setupForm.description} 
                onChange={e => setSetupForm({...setupForm, description: e.target.value})} 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-medium focus:outline-none focus:bg-white focus:border-brand-500 transition-all h-32 resize-none" 
                placeholder="What makes your service unique? Tell your future clients..." 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Key Offerings (Separated by commas) *</label>
              <input 
                required 
                value={setupForm.services} 
                onChange={e => setSetupForm({...setupForm, services: e.target.value})} 
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500 transition-all" 
                placeholder="e.g. 4K Drone, 10-Hour Coverage, Canvas Prints" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operational City *</label>
                <select required value={setupForm.city} onChange={e => setSetupForm({...setupForm, city: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500 transition-all cursor-pointer">
                  <option value="">Select Region</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base Price (LKR) *</label>
                <input required type="number" value={setupForm.basePrice} onChange={e => setSetupForm({...setupForm, basePrice: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-black focus:outline-none focus:bg-white focus:border-brand-500 transition-all" placeholder="50000" />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Financial Settlement Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Settlement Bank</label>
                <input required value={setupForm.bankName} onChange={e => setSetupForm({...setupForm, bankName: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500 transition-all" placeholder="e.g. Sampath Bank" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                <input required value={setupForm.accountName} onChange={e => setSetupForm({...setupForm, accountName: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500 transition-all" placeholder="Full name on book" />
              </div>
              <div className="grid grid-cols-2 gap-4 col-span-full md:col-span-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Code</label>
                  <input required maxLength={4} value={setupForm.bankCode} onChange={e => setSetupForm({...setupForm, bankCode: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500 transition-all text-center" placeholder="7010" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Branch Code</label>
                  <input required maxLength={3} value={setupForm.branchCode} onChange={e => setSetupForm({...setupForm, branchCode: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500 transition-all text-center" placeholder="001" />
                </div>
              </div>
              <div className="col-span-full md:col-span-1 space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
                <input required value={setupForm.accountNumber} onChange={e => setSetupForm({...setupForm, accountNumber: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500 transition-all" placeholder="Enter full number" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-[1.5rem] font-black text-lg transition-all shadow-2xl shadow-gray-300 flex items-center justify-center gap-3 active:scale-95">
            {loading ? <Loader className="animate-spin" /> : <TrendingUp size={24} />}
            {loading ? 'SECURELY SAVING...' : 'LAUNCH MY BUSINESS'}
          </button>
        </form>
      </div>
    </div>
  );

  if (!data) return null;
  const { vendor, eventVendors, metrics } = data;

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-700">
      
      {/* VENDOR HEADER */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50 rounded-full blur-[100px] -z-10 group-hover:bg-brand-100 transition-colors" />
        
        <div className="relative group/avatar">
          <Avatar
            src={vendor?.avatarUrl}
            name={vendor?.businessName}
            size={128}
            className="rounded-[2rem] shadow-2xl group-hover/avatar:scale-105 transition-transform duration-500"
          />
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-2 border-white">
            <CheckSquare size={16} />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none mb-2">{vendor.businessName}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 items-center font-bold">
              <span className="text-brand-600 bg-brand-50 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest border border-brand-100">{vendor.category}</span>
              <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <MapPin size={16} className="text-brand-500" />
                {vendor.city}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border uppercase tracking-widest shadow-sm ${
              vendor.approved 
              ? 'bg-emerald-500 text-white border-emerald-400' 
              : 'bg-amber-400 text-white border-amber-300'
            }`}>
              {vendor.approved ? 'Marketplace Live' : 'Pending Verification'}
            </span>
            <button 
              onClick={() => navigate(`/vendors/${vendor.id}`)}
              className="text-[10px] font-black px-4 py-1.5 bg-gray-900 text-white rounded-full uppercase tracking-widest hover:bg-black transition-all"
            >
              View Public Profile
            </button>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-2 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Rank</span>
           <span className="text-3xl font-black text-gray-900">Top 5%</span>
           <div className="flex gap-1">
             {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-amber-400 text-amber-400" />)}
           </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Total Revenue" value={fmtLKR(metrics.totalEarnings)} trend={12.5} color="emerald" icon={DollarSign} />
        <KpiCard label="Upcoming Events" value={metrics.upcomingEvents.toString()} trend={5.2} color="brand" icon={Calendar} />
        <KpiCard label="Active Tasks" value={metrics.pendingTasks.toString()} trend={-2.4} color="amber" icon={CheckSquare} />
        <KpiCard label="Experience Rating" value={metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : 'New'} color="yellow" icon={Star} percent={metrics.averageRating * 20} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* REVENUE CHART */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3 uppercase">
                <Wallet className="w-6 h-6 text-brand-600" /> Financial Performance
              </h3>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 ml-9">Monthly earnings breakdown</p>
            </div>
            <div className="flex gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
               {[
                 { id: 'daily', label: 'Daily' },
                 { id: 'weekly', label: 'Weekly' },
                 { id: 'monthly', label: 'Monthly' }
               ].map(t => (
                 <button 
                   key={t.id}
                   onClick={() => setPeriod(t.id as any)}
                   className={`text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-tighter transition-all ${
                     period === t.id 
                     ? 'bg-white text-brand-600 shadow-sm' 
                     : 'text-gray-400 hover:text-gray-600'
                   }`}
                 >
                   {t.label}
                 </button>
               ))}
            </div>
          </div>
          
          <div className="h-72 mt-2 -ml-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyEarnings} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="vendorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94A3B8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => fmtLKR(val)} dx={-5} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #F1F5F9', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 'bold' }}
                  cursor={{ stroke: '#8B5CF6', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#vendorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT BOOKINGS */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-8">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Recent Bookings</h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Latest event collaborations</p>
          </div>
          
          <div className="space-y-4">
            {eventVendors.slice(0, 5).map(ev => (
              <div 
                key={ev.id} 
                className="flex items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-3xl hover:bg-brand-50 hover:border-brand-100 transition-all cursor-pointer group" 
                onClick={() => navigate('/services')}
              >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-brand-600 font-black group-hover:scale-110 transition-transform">
                     {ev.event?.name?.charAt(0)}
                   </div>
                   <div className="min-w-0">
                     <p className="text-sm font-black text-gray-900 group-hover:text-brand-700 transition-colors uppercase tracking-tight truncate">{ev.event?.name}</p>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{ev.status.replace(/_/g, ' ')}</p>
                   </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-brand-600 shadow-sm transition-all border border-gray-100">
                   <ArrowRight size={16} />
                </div>
              </div>
            ))}
            
            {eventVendors.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                 <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                 <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Awaiting new bookings</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/services')} 
            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Manage Services Flow <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
