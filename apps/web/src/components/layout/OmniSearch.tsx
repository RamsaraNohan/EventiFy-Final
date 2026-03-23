import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Calendar, Settings, Home, ArrowRight, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

export default function OmniSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggle]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/vendors?q=${query}`);
        setResults(res.data.slice(0, 5)); // Show top 5 vendors
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const navItems = [
    { title: 'Home Dashboard', path: '/dashboard', icon: Home, roles: ['CLIENT', 'VENDOR_OWNER', 'ADMIN'] },
    { title: 'My Events', path: '/events', icon: Calendar, roles: ['CLIENT', 'ADMIN'] },
    { title: 'Explore Vendors', path: '/explore', icon: Zap, roles: ['CLIENT'] },
    { title: 'Account Settings', path: '/settings', icon: Settings, roles: ['CLIENT', 'VENDOR_OWNER', 'ADMIN'] },
  ].filter(item => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggle}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden mx-4"
            >
              <div className="p-8 border-b border-gray-50 flex items-center gap-6">
                <Search size={24} className="text-gray-400" />
                <input 
                  autoFocus
                  placeholder="Search vendors, events, or navigate..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-xl font-black text-gray-900 placeholder-gray-300 uppercase tracking-tight"
                />
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">ESC</span>
                   <button onClick={toggle} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                     <X size={20} className="text-gray-400" />
                   </button>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                {loading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <Loader2 size={32} className="text-brand-500 animate-spin" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning Network...</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Navigation Section */}
                    {(!query || results.length > 0) && (
                      <div className="space-y-2">
                        <h4 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Quick Navigation</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {navItems.map(item => (
                            <button 
                              key={item.path}
                              onClick={() => handleSelect(item.path)}
                              className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all group text-left border border-transparent hover:border-gray-100"
                            >
                              <div className="w-10 h-10 bg-gray-50 group-hover:bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:text-brand-600 transition-colors border border-gray-100 shadow-sm">
                                <item.icon size={18} />
                              </div>
                              <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{item.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Results Section */}
                    {results.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-gray-50">
                        <h4 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Vendor Partners</h4>
                        {results.map(v => (
                          <button 
                            key={v.id}
                            onClick={() => handleSelect(`/vendors/${v.id}`)}
                            className="w-full flex items-center justify-between p-4 hover:bg-brand-50/50 rounded-2xl transition-all group border border-transparent hover:border-brand-100"
                          >
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                                   {v.gallery?.[0] ? (
                                     <img src={v.gallery[0]} alt="" className="w-full h-full object-cover" />
                                   ) : (
                                     <div className="w-full h-full flex items-center justify-center text-gray-300">
                                       <Zap size={20} />
                                     </div>
                                   )}
                                </div>
                                <div className="text-left">
                                   <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{v.businessName}</p>
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{v.category} · {v.city}</p>
                                </div>
                             </div>
                             <ArrowRight size={18} className="text-gray-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                          </button>
                        ))}
                      </div>
                    )}

                    {query && results.length === 0 && !loading && (
                      <div className="py-20 text-center">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">No matches found in standard registry</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-center gap-8">
                 <div className="flex items-center gap-2">
                    <kbd className="text-[9px] font-black text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm">↑↓</kbd>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Navigate</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <kbd className="text-[9px] font-black text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-sm">ENTER</kbd>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Select</span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Global Shortcut Trigger Helper (Invisible but accessible) */}
      {!isOpen && (
         <div className="fixed bottom-8 right-8 z-[90] hidden md:block">
            <button 
              onClick={toggle}
              className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-gray-200 p-3 px-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all group scale-90 opacity-40 hover:opacity-100 hover:scale-100"
            >
              <Search size={16} className="text-gray-400" />
              <div className="flex items-center gap-1.5">
                 <kbd className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded shadow-sm uppercase">Ctrl</kbd>
                 <span className="text-[10px] font-black text-gray-300">+</span>
                 <kbd className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded shadow-sm uppercase">K</kbd>
              </div>
            </button>
         </div>
      )}
    </>
  );
}
