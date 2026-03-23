import { Star, MapPin, Sparkles, MessageSquare, Save, ArrowRight, Target, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar } from '../ui/Avatar';
import { fmtLKR } from '../../utils/dateFormat';

interface RecommendationCardProps {
  recommendation: {
    vendorId: string;
    score: number;
    reason: string;
    metadata: {
      businessName: string;
      category: string;
      basePrice: number;
      city: string;
      avatarUrl?: string;
      averageRating?: number;
    };
  };
}

export default function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const navigate = useNavigate();
  const { metadata, score, reason, vendorId } = recommendation;
  
  // Convert 0.0-1.0 score to percentage
  const matchPercentage = Math.round(score * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.01 }}
      className="bg-white border border-gray-100 rounded-[2.5rem] group hover:border-brand-200 transition-all duration-500 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-2xl hover:shadow-gray-200/50"
    >
      {/* Header Info */}
      <div className="p-8 pb-4 relative">
        <div className="flex justify-between items-start mb-6">
          <div className="bg-brand-50 text-brand-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-500">
            {metadata.category}
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
            <Target size={12} className="group-hover:animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">{matchPercentage}% Alignment</span>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
            <div className="relative group/photo shrink-0">
               <Avatar 
                 src={metadata.avatarUrl} 
                 name={metadata.businessName} 
                 size="lg" 
                 className="rounded-[1.5rem] shadow-xl border-4 border-white ring-1 ring-gray-100 group-hover:scale-105 transition-transform duration-500" 
               />
               <div className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-1.5 rounded-xl shadow-lg border-2 border-white scale-0 group-hover:scale-100 transition-transform">
                  <ShieldCheck size={14} />
               </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-black text-gray-900 group-hover:text-brand-700 transition-colors uppercase tracking-tight leading-none mb-2 truncate">
                {metadata.businessName}
              </h3>
              <div className="flex items-center gap-4 text-gray-400">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                  <MapPin size={12} className="text-brand-500" />
                  {metadata.city}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-500">
                  <Star size={12} className="fill-amber-500" />
                  {metadata.averageRating ? Number(metadata.averageRating).toFixed(1) : 'New'}
                </span>
              </div>
            </div>
        </div>
      </div>

      {/* AI Intelligence Block */}
      <div className="px-8 py-6 flex-1">
        <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 relative group-hover:bg-brand-50/30 transition-colors">
          <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-black text-brand-600 uppercase tracking-widest shadow-sm">
            Nexus Context
          </div>
          <p className="text-gray-500 text-sm italic font-medium leading-relaxed mt-2 group-hover:text-gray-700 transition-colors">
            "{reason}"
          </p>
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-8 pt-4 mt-auto border-t border-gray-50 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] ml-0.5">Starting Model</span>
          <span className="text-lg font-black text-gray-900 block tracking-tighter">{metadata.basePrice ? fmtLKR(metadata.basePrice) : 'Exclusive'}</span>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={() => navigate(`/vendors/${vendorId}`)}
             className="flex items-center gap-3 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-gray-200 transition-all active:scale-95 group/btn"
           >
             Access Profile <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
           </button>
           <button className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all">
              <MessageSquare size={18} />
           </button>
        </div>
      </div>
    </motion.div>
  );
}
