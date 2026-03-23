import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { Ticket, Clock, ArrowRight } from 'lucide-react';

export default function BookingRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  

  const fetchRequests = async () => {
    try {
      const res = await api.get('/events/vendor/mine');
      setRequests(res.data.filter((ev: any) => ev.status === 'PENDING'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.patch(`/events/vendor/${id}/respond`, { action });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-[100px] -z-10" />
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Booking Requests</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Review and manage incoming event invitations</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 font-black text-[10px] uppercase tracking-widest shadow-sm">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          {requests.length} Pending Invites
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
           <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">Synchronizing nexus traffic...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-[3rem] p-24 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-[2rem] flex items-center justify-center mb-6 border border-gray-100 shadow-inner">
             <Ticket size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Stream is Silent</h3>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">No incoming booking requests detected.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((req) => (
            <div key={req.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all group overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/50" />
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-8 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-amber-100 group-hover:scale-110 transition-transform">
                    {req.event?.name?.charAt(0) || 'E'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-amber-600 transition-colors">{req.event?.name}</h3>
                    <div className="flex flex-wrap gap-4 mt-3">
                      <span className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {req.event?.date ? format(new Date(req.event.date), 'MMM d, yyyy · p') : 'TBD'}
                      </span>
                      <span className="flex items-center gap-2 text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-lg border border-brand-100">
                        Client: {req.event?.client?.name}
                      </span>
                    </div>
                    {req.agreedCost && (
                       <div className="mt-4 flex items-center gap-2">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Proposed Project Value:</span>
                          <span className="text-xs font-black text-gray-900">LKR {Number(req.agreedCost).toLocaleString()}</span>
                       </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => handleRespond(req.id, 'reject')}
                    className="flex-1 md:flex-none px-8 py-3.5 rounded-2xl border border-gray-100 text-gray-400 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all font-black text-[10px] uppercase tracking-widest"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => handleRespond(req.id, 'approve')}
                    className="flex-1 md:flex-none px-8 py-3.5 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center justify-center gap-2"
                  >
                    Accept Project
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
