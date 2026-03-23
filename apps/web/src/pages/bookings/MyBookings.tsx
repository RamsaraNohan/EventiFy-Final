import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CreditCard, MessageSquare } from 'lucide-react';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/client');
      setBookings(res.data);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'CONFIRMED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'PENDING': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'REJECTED': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Event Bookings</h1>
          <p className="text-slate-400 mt-1">Track and manage your upcoming event experiences</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 glass-panel animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel p-20 text-center">
          <Calendar className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No bookings found</h3>
          <p className="text-slate-500 mb-8">You haven't scheduled any events yet.</p>
          <button onClick={() => navigate('/explore')} className="btn-primary px-8">
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-primary-500/30 transition-all">
              <div className="flex items-center space-x-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${getStatusStyle(booking.status)}`}>
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-xl font-bold text-white">{booking.vendor?.businessName}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusStyle(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-slate-500" />
                      {format(new Date(booking.startTime), 'MMM d, yyyy • h:mm a')}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-slate-500" />
                      {booking.vendor?.category || 'Service'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 md:mt-0 flex flex-wrap gap-3">
                <button 
                   onClick={() => navigate('/messages')}
                   className="p-3 glass-panel hover:bg-white/5 text-slate-300 border-white/5 rounded-xl transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                
                {booking.status === 'CONFIRMED' && (
                  <button 
                    onClick={() => navigate(`/checkout/${booking.id}`)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Complete Payment
                  </button>
                )}
                
                <button 
                  onClick={() => navigate(`/vendors/${booking.vendorId}`)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
