import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store';
import toast from 'react-hot-toast';
import { Shield, ArrowRight, LogIn } from 'lucide-react';
import api from '../api/client';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/admin/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('admin_token', token);
      dispatch({ type: 'SET_ADMIN_USER', payload: user });
      toast.success('Welcome to ShopYNG Admin Panel!');
      navigate('/');
    } catch {
      toast.error('Invalid credentials. Try admin@shopyng.com / admin123');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5FEFE] via-white to-[#01406D]/5 flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-white/70 backdrop-blur-lg border border-teal/20 p-8 rounded-[40px] shadow-[0_20px_50px_rgba(1,64,109,0.1)]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-teal" />
          </div>
          <h1 className="text-3xl font-artz font-bold text-navy">
            Shop<span className="text-teal">YNG</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-inter font-medium">Admin Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white py-4 rounded-2xl font-semibold text-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6 font-inter">
          Secure admin access &middot; ShopYNG Platform
        </p>
      </div>
    </div>
  );
};

export default Login;
