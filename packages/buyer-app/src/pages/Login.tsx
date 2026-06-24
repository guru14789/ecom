import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2, Chrome } from 'lucide-react';
import { useAppDispatch } from '../store';
import { addToast } from '../store/slices/uiSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signInWithPhone,
  setupRecaptcha,
} from '../lib/firebase/auth';
import { ConfirmationResult } from 'firebase/auth';

type LoginStep = 'method' | 'otp' | 'success' | 'email';

export const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [step, setStep] = useState<LoginStep>('method');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      setStep('success');
      dispatch(addToast({ title: 'Welcome!', message: 'Signed in with Google', type: 'success' }));
      setTimeout(() => navigate(from, { replace: true }), 1500);
    } catch (err: any) {
      dispatch(addToast({ title: 'Google Sign-In Failed', message: err.message, type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      dispatch(addToast({ title: 'Invalid Phone', message: 'Please enter a valid 10-digit number', type: 'error' }));
      return;
    }
    setIsLoading(true);
    try {
      const verifier = setupRecaptcha('recaptcha-page');
      await verifier.render();
      const result = await signInWithPhone(`+91${digits}`, verifier);
      setConfirmation(result);
      setStep('otp');
      dispatch(addToast({ title: 'OTP Sent', message: 'Verification code sent', type: 'success' }));
    } catch (err: any) {
      dispatch(addToast({ title: 'Failed', message: err.message, type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-page-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-page-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      dispatch(addToast({ title: 'Invalid OTP', message: 'Please enter the complete code', type: 'error' }));
      return;
    }
    setIsLoading(true);
    try {
      if (confirmation) await confirmation.confirm(code);
      setStep('success');
      dispatch(addToast({ title: 'Welcome!', message: 'Phone verified successfully', type: 'success' }));
      setTimeout(() => navigate(from, { replace: true }), 1500);
    } catch (err: any) {
      dispatch(addToast({ title: 'Verification Failed', message: err.message, type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      dispatch(addToast({ title: 'Error', message: 'Please enter email and password', type: 'error' }));
      return;
    }
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      setStep('success');
      dispatch(addToast({ title: 'Welcome!', message: isSignUp ? 'Account created!' : 'Logged in!', type: 'success' }));
      setTimeout(() => navigate(from, { replace: true }), 1500);
    } catch (err: any) {
      dispatch(addToast({ title: 'Email Auth Failed', message: err.message, type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-light via-white to-primary-light/10 flex flex-col justify-center items-center p-6 relative">
      <button
        onClick={() => {
          if (step === 'otp') setStep('method');
          else if (step === 'email') setStep('method');
          else navigate('/');
        }}
        className="absolute top-8 left-8 flex items-center gap-2 font-poppins font-bold text-sm text-primary-main hover:text-primary-dark transition-all"
      >
        <ArrowLeft size={16} />
        Back to Storefront
      </button>

      <div className="w-full max-w-[440px] bg-white/70 backdrop-blur-lg border border-primary-main/15 p-8 rounded-[40px] shadow-[0_20px_50px_rgba(1,64,109,0.1)] flex flex-col gap-6 items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <img src="/logo.png" alt="ShopYNG Logo" className="h-12 w-auto mix-blend-multiply filter contrast-110" />
          <div className="flex flex-col gap-1">
            <h1 className="font-poppins font-extrabold text-2xl text-slate-800 tracking-tight">
              {step === 'method' && 'Welcome to ShopYNG'}
              {step === 'otp' && 'Enter OTP'}
              {step === 'email' && (isSignUp ? 'Create Account' : 'Sign In')}
              {step === 'success' && 'Verified!'}
            </h1>
            <p className="font-inter text-xs text-slate-500 font-medium">
              {step === 'method' && 'Choose how to sign in'}
              {step === 'otp' && `Code sent to ${phoneNumber}`}
              {step === 'email' && 'Enter your credentials'}
              {step === 'success' && 'Redirecting...'}
            </p>
          </div>
        </div>

        {step === 'method' && (
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => setStep('email')}
              className="flex items-center justify-center gap-3 w-full bg-white border border-slate-200 hover:border-primary-main rounded-2xl py-3.5 px-5 transition-all font-poppins font-bold text-sm text-slate-700 shadow-sm"
            >
              <Mail size={18} className="text-slate-400" />
              Continue with Email
            </button>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 w-full bg-white border border-slate-200 hover:border-primary-main rounded-2xl py-3.5 px-5 transition-all font-poppins font-bold text-sm text-slate-700 shadow-sm"
            >
              <Chrome size={18} className="text-slate-400" />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-14 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-inter text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/30 focus:border-primary-main transition-all"
                  maxLength={10}
                  required
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-poppins font-semibold text-slate-500 text-sm">+91</span>
              </div>
              <div id="recaptcha-page" />
              <Button type="submit" variant="primary" fullWidth loading={isLoading}>
                Send OTP
              </Button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="w-full flex flex-col gap-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-page-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-poppins font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-main/30 focus:border-primary-main transition-all"
                  autoFocus={index === 0}
                  required
                />
              ))}
            </div>
            <Button type="submit" variant="primary" fullWidth loading={isLoading}>
              Verify OTP
            </Button>
          </form>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="primary" fullWidth loading={isLoading}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-poppins font-bold text-primary-main hover:text-primary-dark text-center"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-emerald-500" size={40} />
            </div>
            <p className="font-poppins font-bold text-lg text-slate-800">You're all set!</p>
          </div>
        )}
      </div>
    </div>
  );
};
