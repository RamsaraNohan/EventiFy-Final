import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Users, Building2, Calendar, DollarSign, TrendingUp, Users2, Activity, Loader2, BarChart3, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getSocket } from '../../lib/socket';
import { KpiCard } from '../../components/ui/KpiCard';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { fmtLKR } from '../../utils/dateFormat';
import AdminEmailTool from '../../components/admin/AdminEmailTool';

interface Metrics {
  overview: {
    users: number;
    vendors: number;
    events: number;
    revenue: number;
  };
  charts: {
    userGrowth: { month: string; count: number }[];
    revenueGrowth: { month: string; total: number }[];
    vendorStats: { category: string; count: number }[];
  };
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();

    const socket = getSocket();
    if (socket) {
      socket.on('payment:success', fetchMetrics);
      return () => {
        socket.off('payment:success', fetchMetrics);
      };
    }
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/admin/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
      <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Synchronizing Ecosystem Data...</p>
    </div>
  );

  if (!metrics) return null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[100px] -z-10" />
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Command Center</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Platform-wide Intelligence & Growth Analytics</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black text-[10px] uppercase tracking-widest shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          System Status: Operational
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Platform Community" value={metrics.overview.users.toString()} trend={8.4} color="blue" icon={Users} />
        <KpiCard label="Verified Vendors" value={metrics.overview.vendors.toString()} trend={12.1} color="emerald" icon={Building2} />
        <KpiCard label="Active Projects" value={metrics.overview.events.toString()} trend={5.7} color="brand" icon={Calendar} />
        <KpiCard label="Net Settlement" value={fmtLKR(metrics.overview.revenue)} trend={15.2} color="amber" icon={DollarSign} />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* User Acquisition */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/40">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                <Users2 className="w-6 h-6 text-brand-600" /> User Acquisition
              </h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1 ml-9">6-Month Growth Trajectory</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100">
               <TrendingUp size={24} />
            </div>
          </div>
          <div className="h-72 mt-2 -ml-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.charts.userGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminUserGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94A3B8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dx={-5} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#fff', border: '1px solid #F1F5F9', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0, 0, 0.1)', padding: '12px' }}
                   itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                   labelStyle={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={4} fillOpacity={1} fill="url(#adminUserGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Performance */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/40">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-emerald-600" /> Platform GMV
              </h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1 ml-9">Transaction volume breakdown</p>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100">
               <DollarSign size={24} />
            </div>
          </div>
          <div className="h-72 mt-2 -ml-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.charts.revenueGrowth} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="6 6" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                <YAxis 
                   stroke="#94A3B8" 
                   fontSize={10} 
                   fontWeight="bold"
                   tickLine={false} 
                   axisLine={false} 
                   tickFormatter={(val) => fmtLKR(val)}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #F1F5F9', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#10B981' }}
                  labelStyle={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 'bold' }}
                  formatter={(value: any) => [fmtLKR(Number(value || 0)), 'Revenue']}
                />
                <Bar dataKey="total" fill="#10B981" radius={[8, 8, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/40 flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                <Activity className="w-6 h-6 text-brand-600" /> Live Stream
              </h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1 ml-9">Real-time platform activity</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[9px] font-black uppercase tracking-tighter animate-pulse">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" /> Live
            </div>
          </div>
          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
            <ActivityFeed />
          </div>
        </div>

        {/* System Email Diagnostic */}
        <AdminEmailTool />
      </div>

      {/* MARKETPLACE DISTRIBUTION */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-10">
           <PieChart className="w-6 h-6 text-brand-600" />
           <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Marketplace Distribution</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {metrics.charts.vendorStats.map((stat, i) => {
            const percentage = Math.round((stat.count / metrics.overview.vendors) * 100);
            return (
              <div key={i} className="space-y-4 group">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-brand-600 transition-colors">{stat.category}</span>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{stat.count} Verified Partners</p>
                  </div>
                  <span className="text-lg font-black text-gray-900 tracking-tighter">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "anticipate" }}
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.3)]" 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
