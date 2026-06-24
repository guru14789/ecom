import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setLoginModalOpen, setPendingAction, addToast } from '../../store/slices/uiSlice';
import { joinGroupSession } from '../../store/slices/authSlice';
import { addItem } from '../../store/slices/cartSlice';
import { PRODUCTS } from '../../utils/constants';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signInWithPhone,
  setupRecaptcha,
} from '../../lib/firebase/auth';
import { ConfirmationResult } from 'firebase/auth';

type AuthMode = 'phone' | 'email' | 'google';

export const LoginModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isLoginModalOpen);
  const pendingAction = useAppSelector((state) => state.ui.pendingAction);

  const [mode, setMode] = useState<AuthMode>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [timer, setTimer] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<ReturnType<typeof setupRecaptcha> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setMode('phone');
        setPhone('');
        setOtp(['', '', '', '', '', '']);
        setEmail('');
        setPassword('');
        setIsSignUp(false);
        setConfirmation(null);
        setIsTimerActive(false);
        setIsLoading(false);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const executePendingActions = () => {
    if (pendingAction) {
      const { type, productId } = pendingAction;
      const product = PRODUCTS.find((p) => p.id === productId);
      if (product) {
        if (type === 'cart') {
          dispatch(addItem({ product, quantity: 1, isGroupBuy: false }));
          dispatch(addToast({ title: 'Item Added', message: `${product.name} added to your basket`, type: 'success' }));
        } else if (type === 'joinGroup') {
          dispatch(joinGroupSession({ productId, initialCount: product.joinedCount }));
          dispatch(addItem({ product, quantity: 1, isGroupBuy: true }));
          dispatch(addToast({ title: 'Group Joined', message: 'You have successfully joined the group deal!', type: 'success' }));
        } else if (type === 'startGroup') {
          dispatch(joinGroupSession({ productId, initialCount: 0 }));
          dispatch(addItem({ product, quantity: 1, isGroupBuy: true }));
          dispatch(addToast({ title: 'Group Started', message: 'Group slot initialized! Share to complete target.', type: 'success' }));
        }
      }
      dispatch(setPendingAction(null));
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      dispatch(addToast({ title: 'Welcome!', message: 'Successfully signed in with Google', type: 'success' }));
      executePendingActions();
      handleClose();
    } catch (err: any) {
      dispatch(addToast({ title: 'Google Sign-In Failed', message: err.message, type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      dispatch(addToast({ title: 'Validation Error', message: 'Please enter email and password', type: 'error' }));
      return;
    }
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        dispatch(addToast({ title: 'Account Created', message: 'Welcome to ShopYNG!', type: 'success' }));
      } else {
        await signInWithEmail(email, password);
        dispatch(addToast({ title: 'Welcome Back!', message: 'Successfully logged in', type: 'success' }));
      }
      executePendingActions();
      handleClose();
    } catch (err: any) {
      const code = err.code as string;
      const messages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Invalid email or password',
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
      };
      dispatch(addToast({ title: 'Email Auth Failed', message: messages[code] || err.message, type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      dispatch(addToast({ title: 'Invalid Phone', message: 'Please enter a valid 10-digit number', type: 'error' }));
      return;
    }
    setIsLoading(true);
    try {
      if (!verifierRef.current && recaptchaRef.current) {
        verifierRef.current = setupRecaptcha('recaptcha-container');
        await verifierRef.current.render();
      }
      const confirmationResult = await signInWithPhone(`+91${digits}`, verifierRef.current!);
      setConfirmation(confirmationResult);
      setTimer(30);
      setIsTimerActive(true);
      dispatch(addToast({ title: 'OTP Sent', message: 'A verification code has been sent', type: 'success' }));
    } catch (err: any) {
      dispatch(addToast({ title: 'Failed to Send OTP', message: err.message, type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.substring(value.length - 1);
    setOtp(next);
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      dispatch(addToast({ title: 'Invalid OTP', message: 'Please enter the complete 6-digit code', type: 'error' }));
      return;
    }
    setIsLoading(true);
    try {
      if (confirmation) {
        await confirmation.confirm(code);
      }
      dispatch(addToast({ title: 'Welcome!', message: 'Phone number verified successfully', type: 'success' }));
      executePendingActions();
      handleClose();
    } catch (err: any) {
      dispatch(addToast({ title: 'Verification Failed', message: err.message || 'Invalid code', type: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp(['', '', '', '', '', '']);
    setTimer(30);
    setIsTimerActive(true);
    otpRefs[0].current?.focus();
    try {
      if (!verifierRef.current && recaptchaRef.current) {
        verifierRef.current = setupRecaptcha('recaptcha-container');
        await verifierRef.current.render();
      }
      const confirmationResult = await signInWithPhone(`+91${phone.replace(/\D/g, '')}`, verifierRef.current!);
      setConfirmation(confirmationResult);
      dispatch(addToast({ title: 'OTP Resent', message: 'A new code has been sent', type: 'success' }));
    } catch {
      dispatch(addToast({ title: 'Failed', message: 'Could not resend OTP', type: 'error' }));
    }
  };

  const handleClose = () => {
    dispatch(setLoginModalOpen(false));
  };

  const modeTabs: { key: AuthMode; label: string }[] = [
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'google', label: 'Google' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {confirmation ? (
        <form onSubmit={handleOtpVerify} className="flex flex-col gap-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <img src="/logo.png" alt="ShopYNG Logo" className="h-12 w-auto mix-blend-multiply filter contrast-110" />
            <div className="flex flex-col gap-1">
              <h2 className="font-poppins font-bold text-xl text-slate-800">Verify OTP</h2>
              <p className="font-inter text-xs text-slate-500">
                Code sent to <strong className="text-slate-700">+91 {phone.replace(/\D/g, '')}</strong>
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-2 py-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={otpRefs[idx]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="w-11 h-13 bg-white border border-slate-200 focus:border-primary-main rounded-2xl text-center font-poppins font-bold text-lg text-slate-800 outline-none shadow-sm transition-all"
              />
            ))}
          </div>

          <div className="flex justify-center text-xs font-inter font-medium text-slate-500">
            {timer > 0 ? (
              <span>Resend in <strong className="text-primary-main">00:{String(timer).padStart(2, '0')}</strong></span>
            ) : (
              <button type="button" onClick={handleResendOtp} className="text-primary-main hover:underline font-bold">
                Resend OTP
              </button>
            )}
          </div>

          <Button type="submit" variant="primary" fullWidth loading={isLoading}>
            Verify & Login
          </Button>

          <button type="button" onClick={() => setConfirmation(null)} className="text-xs text-slate-400 hover:text-slate-600">
            Change phone number
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <img src="/logo.png" alt="ShopYNG Logo" className="h-12 w-auto mix-blend-multiply filter contrast-110" />
            <div className="flex flex-col gap-1">
              <h2 className="font-poppins font-bold text-xl text-slate-800">Login to ShopYNG</h2>
              <p className="font-inter text-xs text-slate-500">Choose how you'd like to sign in</p>
            </div>
          </div>

          <div className="flex bg-slate-100 rounded-2xl p-1">
            {modeTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMode(tab.key)}
                className={`flex-1 py-2.5 rounded-xl font-poppins font-bold text-xs transition-all ${
                  mode === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
              <div className="flex items-center bg-white border border-slate-200 focus-within:border-primary-main rounded-full px-5 py-4 gap-2.5 transition-all">
                <span className="font-poppins font-semibold text-slate-500 border-r border-slate-200 pr-3.5">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent text-slate-800 placeholder-slate-400 outline-none font-inter text-sm font-semibold"
                />
              </div>
              <div id="recaptcha-container" ref={recaptchaRef} />
              <Button type="submit" variant="primary" fullWidth loading={isLoading}>
                Send OTP
              </Button>
            </form>
          )}

          {mode === 'email' && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
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
                className="text-xs text-primary-main hover:underline font-medium"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </form>
          )}

          {mode === 'google' && (
            <div className="flex flex-col gap-4 py-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 w-full bg-white border border-slate-200 hover:border-slate-300 rounded-2xl py-3.5 px-5 transition-all font-poppins font-bold text-sm text-slate-700 shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
