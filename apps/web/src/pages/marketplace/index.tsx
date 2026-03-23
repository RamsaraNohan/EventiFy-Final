import { useState, useEffect } from 'react';
import { Search, MapPin, Star, SlidersHorizontal, X, ArrowRight, Filter } from 'lucide-react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { VENDOR_CATEGORIES, CITIES } from '../../lib/constants';
import { Avatar } from '../../components/ui/Avatar';

const CATEGORIES = ['All', ...VENDOR_CATEGORIES];
const DISPLAY_CITIES = ['All', ...CITIES];

export default function VendorMarketplace() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [city, setCity] = useState('All');
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/vendors')
      .then(res => { setVendors(res.data); setFiltered(res.data); })
      .catch(err => console.error("Failed to load vendors:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = vendors;
    if (search) result = result.filter(v => 
      v.businessName?.toLowerCase().includes(search.toLowerCase()) || 
      v.description?.toLowerCase().includes(search.toLowerCase())
    );
    if (category !== 'All') result = result.filter(v => v.category === category);
    if (city !== 'All') result = result.filter(v => v.city === city);
    result = result.filter(v => !v.basePrice || v.basePrice <= maxPrice);
    setFiltered(result);
  }, [search, category, city, maxPrice, vendors]);

  const clearFilters = () => { setSearch(''); setCategory('All'); setCity('All'); setMaxPrice(1000000); };
  const hasFilters = search || category !== 'All' || city !== 'All' || maxPrice < 1000000;

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER & SEARCH SECTION */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50 rounded-full blur-[120px] -z-10" />
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Vendor Marketplace</h1>
          <p className="text-gray-400 max-w-xl mb-10 font-medium">Find the perfect vendors to bring your event vision to life. From venues to photography, we have it all.</p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-500 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="What are you looking for? (e.g. Wedding Photographer)"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 px-8 py-4 rounded-[1.25rem] font-bold text-sm transition-all shadow-sm ${
                showFilters 
                ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' 
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={18} />
              {showFilters ? 'Hide Filters' : 'More Filters'}
              {hasFilters && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 ml-1" />}
            </button>
          </div>

          {/* Expanded Filter Panel */}
          {showFilters && (
            <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Category</label>
                <div className="relative">
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-900 font-bold focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 appearance-none transition-all cursor-pointer"
                  >
                    {CATEGORIES.map(c => <option key={c} className="bg-white">{c}</option>)}
                  </select>
                  <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Location</label>
                <div className="relative">
                  <select 
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-900 font-bold focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 appearance-none transition-all cursor-pointer"
                  >
                    {DISPLAY_CITIES.map(c => <option key={c} className="bg-white">{c}</option>)}
                  </select>
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Price Range (Max)</label>
                  <span className="text-sm font-bold text-brand-600">LKR {maxPrice.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1000000" 
                  step="10000" 
                  value={maxPrice}
                  onChange={e => setMaxPrice(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-600" 
                />
              </div>

              {hasFilters && (
                <div className="md:col-span-3 flex justify-end">
                  <button onClick={clearFilters} className="text-xs font-bold text-gray-400 hover:text-brand-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-brand-50">
                    <X className="w-3.5 h-3.5" /> Reset all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QUICK CATEGORIES */}
      <div className="flex flex-wrap items-center gap-2">
         {VENDOR_CATEGORIES.slice(0, 6).map(c => (
           <button 
             key={c}
             onClick={() => setCategory(c)}
             className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${
               category === c 
               ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-purple-100' 
               : 'bg-white text-gray-500 border-gray-200 hover:border-brand-200 hover:text-brand-600'
             }`}
           >
             {c}
           </button>
         ))}
      </div>

      {/* VENDOR GRID */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            {loading ? 'Searching vendors...' : `${filtered.length} curated matches`}
          </h2>
          <div className="text-sm text-gray-400 font-medium">Showing top results for you</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {loading ? (
            [1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-[26rem] bg-gray-100 rounded-[2rem] animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-3xl flex items-center justify-center mb-6">
                <Search size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">No neural matches</h3>
              <p className="text-gray-400 max-w-sm mb-8 font-medium">We couldn't find any vendors matching those criteria. Try widening your search or reset filters.</p>
              <button 
                onClick={clearFilters} 
                className="px-10 py-3.5 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-200 hover:scale-105 transition-all active:scale-95"
              >
                Reset Search
              </button>
            </div>
          ) : (
            filtered.map(vendor => (
              <div
                key={vendor.id}
                onClick={() => navigate(`/vendors/${vendor.id}`)}
                className="bg-white border border-gray-100 group overflow-hidden cursor-pointer hover:-translate-y-2 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] flex flex-col"
              >
                {/* HERO IMAGE CONTAINER */}
                <div className="h-64 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gray-200 animate-pulse group-hover:scale-110 transition-transform duration-700" />
                  <img 
                    src={vendor.owner?.avatarUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80'} 
                    alt={vendor.businessName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md border border-white/50 px-3 py-1.5 rounded-2xl text-xs font-black text-amber-600 flex items-center gap-1.5 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 
                    {vendor.rating ? Number(vendor.rating).toFixed(1) : 'New'}
                  </div>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-[11]" />
                  <div className="absolute bottom-4 left-4 z-20">
                     <span className="bg-brand-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-purple-200">
                        {vendor.category}
                     </span>
                  </div>
                </div>

                <div className="p-7 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors line-clamp-1">{vendor.businessName}</h3>
                  <div className="flex items-center text-gray-400 font-medium text-sm mb-4">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-brand-500" />
                    {vendor.city || 'Sri Lanka'}
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1 font-medium leading-relaxed">
                    {vendor.description || `Premium ${vendor.category?.toLowerCase()} services for your special day in ${vendor.city}.`}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-0.5">Starting at</span>
                      <span className="text-lg font-black text-gray-900 tracking-tight">LKR {(vendor.basePrice || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 group-hover:bg-brand-600 group-hover:text-white flex items-center justify-center transition-all duration-300">
                       <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
