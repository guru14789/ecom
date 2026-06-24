import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../store';
import { ArrowRight, LogIn, Store, Mail, Phone } from 'lucide-react';
import api from '../api/client';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loginMethod, setLoginMethod] = useState<'otp' | 'email'>('otp');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { phoneNumber: phone });
      setStep('otp');
      toast.success('OTP sent to your phone');
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      toast.error('Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phoneNumber: phone, otp });
      const { accessToken, user } = res.data;
      localStorage.setItem('vendor_token', accessToken);
      dispatch({ type: 'SET_VENDOR_USER', payload: { id: user.id, name: user.fullName || 'Vendor', email: user.email || '', storeName: user.fullName || 'My Store' } });
      toast.success('Welcome to ShopYNG Vendor Panel!');
      navigate('/');
    } catch {
      toast.error('Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/vendor/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('vendor_token', token);
      dispatch({ type: 'SET_VENDOR_USER', payload: { id: user.id, name: user.fullName || 'Vendor', email: user.email || '', storeName: user.fullName || 'My Store' } });
      toast.success('Welcome to ShopYNG Vendor Panel!');
      navigate('/');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5FEFE] via-white to-[#01406D]/5 flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-white/70 backdrop-blur-lg border border-teal/20 p-8 rounded-[40px] shadow-[0_20px_50px_rgba(1,64,109,0.1)]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store size={28} className="text-teal" />
          </div>
          <h1 className="text-3xl font-artz font-bold text-navy">Shop<span className="text-teal">YNG</span></h1>
          <p className="text-xs text-slate-500 mt-1 font-inter font-medium">Vendor Partner Login</p>
        </div>

        {loginMethod === 'otp' ? (
          step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                  maxLength={10}
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-navy text-white py-4 rounded-2xl font-semibold text-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? 'Sending...' : 'Send OTP'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-slate-600">OTP sent to <span className="font-semibold">+91 {phone}</span></p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm text-center text-lg tracking-[8px] font-bold focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal"
                maxLength={6}
              />
              <button type="submit" disabled={loading} className="w-full bg-navy text-white py-4 rounded-2xl font-semibold text-sm hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? 'Verifying...' : 'Verify & Login'} <LogIn size={16} />
              </button>
              <button type="button" onClick={() => setStep('phone')} className="w-full text-center text-xs text-teal font-semibold">Change phone number</button>
            </form>
          )
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" required />
            <button type="submit" disabled={loading} className="w-full bg-navy text-white py-4 rounded-2xl font-semibold text-sm hover:bg-primary-hover transition-colors">
              {loading ? 'Logging in...' : 'Login with Email'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
          <button onClick={() => { setLoginMethod(loginMethod === 'otp' ? 'email' : 'otp'); setStep('phone'); }} className="text-xs text-slate-500 text-center font-medium flex items-center justify-center gap-2">
            {loginMethod === 'otp' ? <><Mail size={14} /> Login with Email</> : <><Phone size={14} /> Login with OTP</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;