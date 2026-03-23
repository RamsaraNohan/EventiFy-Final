import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { Calendar, Search, MoreVertical, ExternalLink, Loader, TrendingUp, AlertCircle, CheckCircle, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtLKR } from '../../utils/dateFormat';
import { KpiCard } from '../../components/ui/KpiCard';
import { Avatar } from '../../components/ui/Avatar';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    api.get('/events/admin/all')
      .then(res => { setEvents(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const filteredEvents = events.filter(evt => {
    const matchesSearch = evt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          evt.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || evt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader className="w-10 h-10 text-brand-500 animate-spin" />
      <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Scanning Global Events...</span>
    </div>
  );

  const totalBudget = events.reduce((sum, e) => sum + (Number(e.budget) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[100px] -z-10" />
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none mb-2">Event Oversight</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Global Project Monitoring & Logistics Management</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="text"
              placeholder="Search IDs or names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-xs font-black uppercase tracking-widest text-gray-900 placeholder-gray-300 focus:outline-none focus:border-brand-500 w-full sm:w-64 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 focus:outline-none focus:border-brand-500 shadow-sm cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="VENDORS_PENDING">Vendors Pending</option>
            <option value="EVENT_SOON">Event Soon</option>
            <option value="COMPLETED">Completed</option>
            <option value="PAYMENT_OVERDUE">Payment Overdue</option>
          </select>
        </div>
      </div>

      {/* STATS mini grid - Unified KpiCard usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Total Projects" value={events.length.toString()} color="blue" icon={Calendar} />
        <KpiCard label="Execution Done" value={events.filter(e => e.status === 'COMPLETED').length.toString()} color="emerald" icon={CheckCircle} />
        <KpiCard label="Critical/Upcoming" value={events.filter(e => ['EVENT_SOON', 'VENDORS_PENDING', 'PAYMENT_OVERDUE'].includes(e.status)).length.toString()} color="amber" icon={AlertCircle} />
        <KpiCard label="Budget Velocity" value={fmtLKR(totalBudget)} color="brand" icon={TrendingUp} />
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Project & Timeline</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Client Authority</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Vendor Squad</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Settlement</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Phase</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEvents.map(evt => (
                <tr key={evt.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <div className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-brand-600 transition-colors">{evt.name}</div>
                      <div className="flex items-center gap-2 mt-1.5 font-bold text-gray-400 text-[10px] uppercase">
                        <Calendar size={12} className="text-brand-500" />
                        {format(new Date(evt.date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={evt.client?.avatarUrl} 
                        name={evt.client?.name} 
                        size="sm" 
                        className="rounded-xl border-2 border-white shadow-sm ring-1 ring-gray-100" 
                      />
                      <div>
                        <div className="text-[10px] font-black text-gray-900 uppercase tracking-tight leading-none mb-0.5">{evt.client?.name}</div>
                        <div className="text-[9px] text-gray-400 font-bold lowercase tracking-wider">{evt.client?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="flex -space-x-2">
                        {evt.eventVendors?.slice(0, 3).map((ev: any) => (
                          <div key={ev.id} title={ev.vendor.businessName} className="w-8 h-8 rounded-xl bg-white border-2 border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                             <img src={ev.vendor?.avatarUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80'} className="w-full h-full object-cover" alt="" />
                          </div>
                        ))}
                        {evt.eventVendors?.length > 3 && (
                          <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center text-[9px] font-black border-2 border-white shadow-sm">
                            +{evt.eventVendors.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{evt.eventVendors?.length || 0} active</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-black text-emerald-600 tracking-tighter">LKR {evt.budget?.toLocaleString() || '0'}</div>
                    <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                       <MapPin size={10} className="text-brand-400" />
                       {evt.location || 'Global'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={evt.status} />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <Link to={`/events/${evt.id}`} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-brand-600 hover:border-brand-100 shadow-sm transition-all group/btn">
                        <ExternalLink size={18} className="group-hover/btn:scale-110 transition-transform" />
                      </Link>
                      <button className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 shadow-sm transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                    <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:hidden transition-all flex items-center gap-2 justify-end ml-auto">
                       Audit Project <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center text-gray-300 font-bold uppercase tracking-[0.2em] text-xs">
                    No matching logistics records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
