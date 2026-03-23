import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Users, Star } from 'lucide-react';
import { api } from '../../lib/api';
import { Avatar } from '../../components/ui/Avatar';
import { fmtLKR } from '../../utils/dateFormat';
import { resolveAvatar } from '../../utils/avatar';

export default function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [featuredVendors, setFeaturedVendors] = useState<any[]>([]);

  useEffect(() => {
    api.get('/vendors?limit=4&approved=true')
      .then(r => setFeaturedVendors(r.data.data ?? []))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-600">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">EventiFy</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section
        className="py-20 px-6 md:px-10 text-center"
        style={{ background: 'linear-gradient(160deg, #F5F3FF 0%, #EDE9FE 40%, #FDF2F8 100%)' }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Plan Your Perfect Event,<br />
          <span className="text-purple-600">Effortlessly.</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
          Connect with Sri Lanka's best vendors, manage your events, and make every occasion unforgettable.
        </p>

        {/* SEARCH BAR */}
        <div className="flex items-center gap-3 max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-gray-100 px-4 py-3">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') navigate('/register'); }}
            placeholder='Find vendors, venues, photographers...'
            className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
          />
          <button
            onClick={() => navigate('/register')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0"
          >
            Search
          </button>
        </div>
      </section>

      {/* FEATURED VENDORS */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Featured Vendors</h2>
          <button onClick={() => navigate('/register')} className="text-sm text-purple-600 hover:underline font-medium">
            See all →
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(featuredVendors ?? []).slice(0, 4).map((vendor: any) => (
            <div
              key={vendor.id}
              onClick={() => navigate('/register')}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 group"
            >
              <div className="h-32 overflow-hidden bg-gradient-to-br from-purple-100 to-pink-50 relative flex items-center justify-center">
                {vendor.portfolioImages?.[0] ? (
                  <img src={resolveAvatar(vendor.portfolioImages[0])} alt={vendor.businessName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                   <Avatar src={vendor.owner?.avatarUrl} name={vendor.businessName} size="lg" />
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-gray-900 text-sm truncate">{vendor.businessName}</p>
                <p className="text-xs text-gray-400 truncate">{vendor.category}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-purple-600">{fmtLKR(vendor.basePrice)}</span>
                  <span className="text-xs bg-purple-600 text-white px-2.5 py-1 rounded-lg font-medium">Connect</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 py-14 px-6 md:px-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { Icon: Calendar, step: '1', title: 'Create Your Event', desc: 'Set your date, location, and budget in under 2 minutes.', color: 'bg-purple-50 text-purple-600' },
              { Icon: Users, step: '2', title: 'Find & Book Vendors', desc: 'Browse 25+ verified Sri Lankan vendors and book with one click.', color: 'bg-blue-50 text-blue-600' },
              { Icon: Star, step: '3', title: 'Make It Unforgettable', desc: 'Track progress, pay securely, and celebrate your perfect event.', color: 'bg-emerald-50 text-emerald-600' },
            ].map(({ Icon, step, title, desc, color }) => (
              <div key={step} className="text-center">
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-purple-600 py-16 px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to plan your event?</h2>
        <p className="text-purple-200 text-sm mb-6">Join thousands of clients and vendors across Sri Lanka</p>
        <button
          onClick={() => navigate('/register')}
          className="bg-white text-purple-700 font-semibold px-8 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-sm"
        >
          Get Started Free
        </button>
      </section>
    </div>
  );
}
