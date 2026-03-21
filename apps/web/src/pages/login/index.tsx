import React, { useState } from 'react';
import { useAuthStore } from '../../lib/auth';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full border border-primary-500/30 flex items-center justify-center bg-primary-500/10 shadow-[0_0_20px_rgba(20,184,166,0.3)]">
            <span className="neon-text text-3xl">E</span>
          </div>
        </div>
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-white mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-slate-400">Enter the portal to continue</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel py-8 px-4 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center font-medium backdrop-blur-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-300">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-futuristic"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-futuristic"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full neon-button"
              >
                ACCESS GRANTED
              </button>
            </div>
            
            <div className="mt-6 text-center text-sm text-slate-400">
              New to EventiFy? <Link to="/register" className="text-primary-400 font-bold hover:text-primary-300 transition-colors">Initialize account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
