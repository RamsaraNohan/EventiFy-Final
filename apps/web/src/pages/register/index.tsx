import React, { useState } from 'react';
import { useAuthStore } from '../../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CLIENT');
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', { email, password, name, role });
      login(res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL — brand side (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #A78BFA 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">E</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">EventiFy</span>
          </div>

          {/* Hero text */}
          <div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
              Plan your perfect<br />
              <span className="text-purple-200">Sri Lankan</span><br />
              event.
            </h1>
            <p className="text-purple-200 text-base leading-relaxed max-w-sm">
              Connect with 25+ verified vendors, manage bookings, and bring your vision to life — all in one place.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-8">
            {[
              { value: '25+', label: 'Verified vendors' },
              { value: '22', label: 'Categories' },
              { value: '12', label: 'Cities' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-purple-300 text-xs font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — form side */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo (only shows on small screens) */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">E</span>
            </div>
            <span className="text-gray-900 font-bold text-lg">EventiFy</span>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
            {/* PAGE HEADING */}
            <h2 className="text-2xl font-black text-gray-900 mb-1">Create your account</h2>
            <p className="text-gray-400 text-sm mb-7">Join the EventiFy community today</p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center font-medium">{error}</div>}
              
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5">I am a...</label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-purple-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="CLIENT">Client (Planning an event)</option>
                  <option value="VENDOR_OWNER">Vendor (Offering services)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5">Full Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-purple-500 transition-all"
                    placeholder="Aarav Perera"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-purple-500 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5">Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-purple-500 transition-all"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-gray-200"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>

          {/* Footer link */}
          <p className="text-center text-sm text-gray-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
