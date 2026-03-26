import { useState, useEffect } from 'react';
import { Search, Calendar, Star, MapPin, CreditCard } from 'lucide-react';
import { useAuthStore } from '../../../lib/auth';
import { api } from '../../../lib/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
//export
export default function ClientDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
//user
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings/client');
        setBookings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);
<></>
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Welcome back, {user?.name?.split(' ')[0] || 'Explorer'}
        </h1>
        <p className="text-slate-400 max-w-xl">
          Ready to plan your next spectacular event? Find top-tier vendors and manage your upcoming experiences.
        </p>

        <div className="mt-8 relative max-w-2xl">
          <div className="relative flex items-center bg-[#0f111a]/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-inner">
            <Search className="w-5 h-5 text-primary-400 ml-3 mr-2" />
            <input 
              type="text"
              placeholder="Search photographers, venues, caterers..."
              className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none px-2 py-2"
            />
            <button onClick={() => navigate('/explore')} className="btn-primary text-sm py-2 px-6 ml-2">
              Find Vendors
            </button>
          </div>
        </div>
      </div>
<></>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">My Event Bookings</h2>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500 text-sm">Syncing with nexus...</p>
            ) : bookings.length === 0 ? (
              <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5">
                <p className="text-slate-500 text-sm mb-3">You don't have any bookings yet.</p>
                <button onClick={() => navigate('/explore')} className="text-primary-400 text-sm hover:underline">
                  Explore the Marketplace
                </button>
              </div>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-4 mb-3 sm:mb-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      booking.status === 'CONFIRMED' ? 'bg-emerald-900/50 text-emerald-400' :
                      booking.status === 'PENDING' ? 'bg-amber-900/50 text-amber-400' :
                      'bg-rose-900/50 text-rose-400'
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{booking.vendor?.businessName || 'Unknown Vendor'}</h3>
                      <p className="text-sm text-slate-400 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {booking.vendor?.category || 'General'}
                      </p>
                    </div>
                  </div>
                  <div className="sm:text-right flex flex-col items-start sm:items-end">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border mb-2 uppercase tracking-wide ${
                      booking.status === 'PAID' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                      booking.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      booking.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {booking.status}
                    </span>
                    <p className="text-sm text-slate-400">
                      {format(new Date(booking.startTime), 'MMM d, yyyy h:mm a')}
                    </p>
                    {booking.status === 'CONFIRMED' && (
                      <button 
                        onClick={() => navigate(`/checkout/${booking.id}`)}
                        className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-[0_4px_15px_rgba(79,70,229,0.3)] flex items-center justify-center group"
                      >
                        <CreditCard className="w-3 h-3 mr-2 group-hover:scale-110 transition-transform" />
                        Complete Payment
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white mb-6">Saved Vendors</h2>
          <div className="bg-[#0f111a]/50 border border-white/5 rounded-xl p-6 text-center text-slate-400 flex flex-col items-center">
            <Star className="w-8 h-8 text-slate-600 mb-3" />
            <p className="text-sm">You haven't saved any vendors yet.</p>
            <button onClick={() => navigate('/explore')} className="mt-4 text-primary-400 text-sm font-medium hover:underline">
              Explore Marketplace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
//codingend