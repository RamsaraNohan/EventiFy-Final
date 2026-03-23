import { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, BrainCircuit, Rocket, Loader, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import RecommendationCard from '../components/ai/RecommendationCard';
import { motion } from 'framer-motion';
import { VENDOR_CATEGORIES, CITIES } from '../lib/constants';

export default function AIRecommendations() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    budgetMax: 500000
  });

  const [aiUnavailable, setAiUnavailable] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setAiUnavailable(false);
      
      const res = await api.post('/ai/recommendations', {
        query: query.trim() || undefined,
        categories: filters.category ? [filters.category] : undefined,
        city: filters.city ? filters.city : undefined,
        budgetMax: filters.budgetMax,
        limit: 10
      });
      
      if (res.data.aiUnavailable) {
        setAiUnavailable(true);
      }
      
      let newResults = [];
      if (res.data.vendors && Array.isArray(res.data.vendors)) {
        newResults = res.data.vendors;
      } else if (res.data.recommendations && Array.isArray(res.data.recommendations)) {
        newResults = res.data.recommendations;
      }
      
      setResults(newResults);
    } catch (err) {
      console.error(err);
      setAiUnavailable(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* AI Unavailable Banner */}
      {aiUnavailable && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 px-6 py-4 rounded-[2rem] flex items-center justify-center text-xs font-black uppercase tracking-widest shadow-sm">
           <Sparkles className="w-4 h-4 mr-3 animate-pulse" />
           Standard Index Mode: AI-powered nexus is currently undergoing maintenance.
        </div>
      )}
      
      {/* Search Header - Premium Gradient Design */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-indigo-500 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
        <div className="relative bg-white border border-gray-100 rounded-[3rem] p-10 md:p-16 overflow-hidden shadow-2xl shadow-gray-200/50">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <BrainCircuit size={200} className="text-brand-600" />
          </div>
          
          <div className="max-w-3xl relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-200">
                  <Sparkles size={24} />
               </div>
               <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em]">Neural Matching Engine</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight uppercase leading-none mb-6">
              The <span className="text-brand-600">Nexus</span> AI Discovery
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-medium mb-10 leading-relaxed max-w-2xl">
              Describe your dream event in natural language. Our neural nexus will analyze 1,000+ data points to find your perfect vendor matches.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group/input">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-focus-within/input:text-brand-600 transition-colors" />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. A bohemian garden wedding in Kandy with rustic floral arrangements..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] py-5 pl-16 pr-6 text-gray-900 font-bold placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all shadow-inner"
                />
              </div>
              <button 
                onClick={fetchRecommendations}
                disabled={loading}
                className="bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-[2rem] font-black transition-all shadow-2xl shadow-gray-300 flex items-center justify-center gap-3 active:scale-95 text-xs uppercase tracking-widest min-w-[200px]"
              >
                {loading ? <Loader className="animate-spin" /> : <Rocket size={20} />}
                {loading ? 'CALCULATING...' : 'SCAN NEXUS'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Neural Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm group">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
              <Filter className="w-4 h-4 text-brand-600" /> Neural Constraints
            </h3>
            
            <div className="grid gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Category</label>
                <select 
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-black text-gray-600 focus:outline-none focus:bg-white focus:border-brand-500 transition-all cursor-pointer uppercase tracking-tight"
                >
                  <option value="">Global Streams</option>
                  {VENDOR_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Geographical Focus</label>
                <select 
                  value={filters.city}
                  onChange={(e) => setFilters({...filters, city: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-black text-gray-600 focus:outline-none focus:bg-white focus:border-brand-500 transition-all cursor-pointer uppercase tracking-tight"
                >
                  <option value="">All Regions</option>
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end ml-1">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget CAP</label>
                   <span className="text-[10px] font-black text-brand-600">LKR {(filters.budgetMax / 1000).toFixed(0)}K</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1000000" 
                  step="10000"
                  value={filters.budgetMax}
                  onChange={(e) => setFilters({...filters, budgetMax: parseInt(e.target.value)})}
                  className="w-full h-1.5 bg-gray-100 rounded-full appearance-none accent-brand-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-8">
             <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                <BrainCircuit size={14} className="text-brand-500" /> Intelligence Note
             </h4>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-relaxed">
               Neural search matches based on intent and visual style, not just keywords. Describe the 'mood' or 'vibe' of your event for optimal results.
             </p>
          </div>
        </div>

        {/* Results Explorer */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-80 bg-gray-100 rounded-[2.5rem] animate-pulse"></div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-32 bg-white border border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-3xl flex items-center justify-center mb-8">
                <Sparkles size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">No matches in current nexus</h3>
              <p className="text-gray-400 font-medium max-w-sm">The AI couldn't find exact matches for your description. Try adjusting your neural filters or detailing your vision differently.</p>
              <button onClick={() => { setQuery(''); setFilters({ category: '', city: '', budgetMax: 500000 }); fetchRecommendations(); }} className="mt-8 text-brand-600 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:underline">
                 Reset Digital Filters <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {results.map((rec) => (
                <RecommendationCard key={rec.vendorId} recommendation={rec} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
