import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Phone, Mail, MapPin, Package, Heart, Bell, Shield,
  LogOut, ChevronRight, Edit2, Wallet, Star, Gift, Settings,
  ArrowLeft, Camera, CheckCircle, Plus, Trash2,
  ToggleLeft, ToggleRight, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { api } from '../api/client';
import { useAppDispatch, useAppSelector } from '../store';
import { addAddress, removeAddress } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import { Address } from '../types';
import { useAuth } from '../hooks/useAuth';

// ─── Sub-components ──────────────────────────────────────────

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({
  icon, label, value, color
}) => (
  <div className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border ${color} bg-white`}>
    <div className="text-current opacity-80">{icon}</div>
    <span className="font-poppins font-extrabold text-lg">{value}</span>
    <span className="font-inter text-[10px] font-semibold text-slate-500 text-center">{label}</span>
  </div>
);

const NavRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  badge?: string | number;
  danger?: boolean;
  onClick: () => void;
}> = ({ icon, label, subtitle, badge, danger, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left border-b border-slate-50 last:border-0 rounded-xl ${
      danger ? 'hover:bg-rose-50' : ''
    }`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
      danger ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-600'
    }`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`font-poppins font-bold text-sm ${danger ? 'text-rose-600' : 'text-slate-800'}`}>{label}</p>
      {subtitle && <p className="font-inter text-[11px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
    </div>
    {badge !== undefined && (
      <span className="bg-primary-main text-white text-[10px] font-poppins font-bold px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
    <ChevronRight size={15} className={danger ? 'text-rose-300' : 'text-slate-300'} />
  </button>
);

// ─── Address Form Modal ───────────────────────────────────────

const AddressForm: React.FC<{ onSave: (a: Address) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [form, setForm] = useState<Address>({
    houseNo: '', area: '', pincode: '', landmark: '', city: '', state: '', tag: 'Home'
  });

  const handleChange = (field: keyof Address, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.houseNo.trim() || !form.area.trim() || !form.pincode.trim()) return;
    onSave({ ...form, id: Math.random().toString(36).substring(2, 9) });
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-primary-main/20 focus:border-primary-main transition-all';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h3 className="font-poppins font-bold text-base text-slate-800">Add New Address</h3>

      <div className="grid grid-cols-2 gap-3">
        <input required placeholder="House / Flat No." value={form.houseNo} onChange={(e) => handleChange('houseNo', e.target.value)} className={inputClass} />
        <input required placeholder="Area / Street" value={form.area} onChange={(e) => handleChange('area', e.target.value)} className={inputClass} />
        <input required placeholder="Pincode" maxLength={6} value={form.pincode} onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/, ''))} className={inputClass} />
        <input placeholder="Landmark" value={form.landmark} onChange={(e) => handleChange('landmark', e.target.value)} className={inputClass} />
        <input placeholder="City" value={form.city} onChange={(e) => handleChange('city', e.target.value)} className={inputClass} />
        <input placeholder="State" value={form.state} onChange={(e) => handleChange('state', e.target.value)} className={inputClass} />
      </div>

      <div className="flex gap-2">
        {(['Home', 'Office', 'Other'] as const).map((tag) => (
          <button
            type="button"
            key={tag}
            onClick={() => handleChange('tag', tag)}
            className={`px-4 py-1.5 rounded-full border text-xs font-poppins font-bold transition-all ${
              form.tag === tag ? 'bg-primary-main text-white border-primary-main' : 'border-slate-200 text-slate-500'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-1">
        <button type="button" onClick={onCancel} className="flex-1 border border-slate-200 text-slate-600 font-poppins font-bold text-sm py-2.5 rounded-xl hover:bg-slate-50 transition-all">
          Cancel
        </button>
        <button type="submit" className="flex-1 bg-primary-main hover:bg-primary-hover text-white font-poppins font-bold text-sm py-2.5 rounded-xl shadow-sm transition-all">
          Save Address
        </button>
      </div>
    </form>
  );
};

// ─── Main Profile Page ────────────────────────────────────────

export const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector((state) => state.auth.user);
  const addresses = useAppSelector((state) => state.auth.addresses);
  const orders = useAppSelector((state) => state.auth.orders);
  const walletBalance = useAppSelector((state) => state.auth.walletBalance);
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);
  const notifications = useAppSelector((state) => state.notifications.unreadCount);

  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'main' | 'addresses'>('main');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [wallet, setWallet] = useState<{ balance: number; transactions: any[] }>({ balance: 0, transactions: [] });
  const [preferences, setPreferences] = useState({ email: true, sms: true, push: true });
  const [showWallet, setShowWallet] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const handleLogout = async () => {
    await logout();
    dispatch(addToast({ title: 'Logged Out', message: 'You have been logged out successfully.', type: 'info' }));
    navigate('/');
  };

  const handleSaveAddress = (address: Address) => {
    dispatch(addAddress(address));
    setShowAddressForm(false);
    dispatch(addToast({ title: 'Address Saved', message: 'Your new address has been added.', type: 'success' }));
  };

  const fetchWallet = async () => {
    try {
      const res = await api.get('/users/me/wallet');
      setWallet(res.data.data || { balance: 0, transactions: [] });
    } catch {}
  };

  const fetchPreferences = async () => {
    try {
    } catch {}
  };

  useEffect(() => { fetchWallet(); }, []);

  if (!user?.isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto px-6 pt-32 pb-20 min-h-screen flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center">
          <User size={48} className="text-slate-400" />
        </div>
        <div>
          <h2 className="font-poppins font-bold text-xl text-slate-700">You're not signed in</h2>
          <p className="font-inter text-sm text-slate-400 mt-1">Sign in to view your profile, orders, and more.</p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="bg-primary-main hover:bg-primary-hover text-white font-poppins font-bold px-10 py-3.5 rounded-2xl shadow-sm transition-all"
        >
          Sign In to Your Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {activeSection !== 'main' && (
          <button onClick={() => setActiveSection('main')} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
        )}
        <h1 className="font-poppins font-extrabold text-xl text-slate-800">
          {activeSection === 'main' ? 'My Account' : 'Saved Addresses'}
        </h1>
      </div>

      {/* ── MAIN SECTION ─────────────────────────────────── */}
      {activeSection === 'main' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
          {/* Profile Card */}
          <div className="bg-gradient-to-br from-primary-main to-primary-dark p-6 rounded-3xl text-white shadow-[0_8px_30px_rgba(1,64,109,0.3)] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
            <div className="relative flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 border-white/30 bg-white/20">
                  <img src="/profile.png" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Camera size={10} className="text-primary-main" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-poppins font-extrabold text-lg">{user.fullName || 'Guest User'}</h2>
                <div className="flex items-center gap-1.5 mt-0.5 opacity-90">
                  <Phone size={11} />
                  <span className="font-inter text-xs font-medium">{user.phoneNumber}</span>
                </div>
                {user.email && (
                  <div className="flex items-center gap-1.5 mt-0.5 opacity-80">
                    <Mail size={11} />
                    <span className="font-inter text-xs">{user.email}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <CheckCircle size={11} className="fill-white" />
                  <span className="text-[10px] font-inter font-bold opacity-90">Verified Account</span>
                </div>
              </div>
              <button className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all">
                <Edit2 size={13} />
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard
              icon={<Package size={18} />}
              label="Orders"
              value={orders.length}
              color="border-blue-100 text-blue-600"
            />
            <StatCard
              icon={<Heart size={18} />}
              label="Wishlist"
              value={wishlistCount}
              color="border-rose-100 text-rose-500"
            />
            <StatCard
              icon={<Wallet size={18} />}
              label="Wallet"
              value={`₹${walletBalance}`}
              color="border-emerald-100 text-emerald-600"
            />
            <StatCard
              icon={<Bell size={18} />}
              label="Alerts"
              value={notifications}
              color="border-amber-100 text-amber-600"
            />
          </div>

          {/* Wallet Section */}
          {showWallet && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-artz font-bold text-navy flex items-center gap-2"><Wallet size={16} className="text-teal" /> Wallet</h3>
                <button onClick={() => setShowWallet(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
              </div>
              <div className="bg-gradient-to-r from-teal to-teal/80 rounded-xl p-4 mb-3">
                <p className="text-xs text-white/80">Available Balance</p>
                <p className="text-2xl font-bold text-white">₹{wallet.balance.toLocaleString('en-IN')}</p>
              </div>
              {wallet.transactions.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {wallet.transactions.slice(0, 10).map((tx: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2">
                        {tx.type === 'credit' ? <ArrowDownLeft size={14} className="text-green-500" /> : <ArrowUpRight size={14} className="text-red-500" />}
                        <div>
                          <p className="text-slate-700 text-xs">{tx.reason || tx.type}</p>
                          <p className="text-[10px] text-slate-400">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}</p>
                        </div>
                      </div>
                      <span className={`font-semibold text-xs ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Notification Preferences */}
          {showPreferences && (
            <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4 animate-fadeIn">
              <h3 className="font-artz font-bold text-navy flex items-center gap-2 mb-3"><Bell size={16} className="text-teal" /> Notification Preferences</h3>
              <div className="space-y-3">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Order updates, promotions via email' },
                  { key: 'sms', label: 'SMS Notifications', desc: 'Order updates via text message' },
                  { key: 'push', label: 'Push Notifications', desc: 'Real-time updates on this device' },
                ].map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm text-slate-700">{pref.label}</p>
                      <p className="text-xs text-slate-400">{pref.desc}</p>
                    </div>
                    <button onClick={() => {
                      const updated = { ...preferences, [pref.key]: !(preferences as any)[pref.key] };
                      setPreferences(updated);
                      api.put('/users/me/preferences', { notifications: updated }).catch(() => {});
                    }}>
                      {(preferences as any)[pref.key] ? <ToggleRight size={24} className="text-teal" /> : <ToggleLeft size={24} className="text-slate-300" />}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowPreferences(false)} className="text-xs text-slate-400 hover:text-slate-600 mt-2">Close</button>
            </div>
          )}

          {/* Navigation Groups */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <NavRow icon={<Package size={16} />} label="My Orders" subtitle={`${orders.length} orders placed`} onClick={() => navigate('/orders')} />
            <NavRow icon={<Heart size={16} />} label="Wishlist" subtitle={`${wishlistCount} saved items`} onClick={() => navigate('/wishlist')} />
            <NavRow icon={<Bell size={16} />} label="Notifications" subtitle="Manage your alerts" badge={notifications > 0 ? notifications : undefined} onClick={() => navigate('/notifications')} />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <NavRow icon={<MapPin size={16} />} label="Saved Addresses" subtitle={`${addresses.length} address${addresses.length !== 1 ? 'es' : ''} saved`} onClick={() => setActiveSection('addresses')} />
            <NavRow icon={<Wallet size={16} />} label="Wallet & Payments" subtitle={`Balance: ₹${walletBalance}`} onClick={() => { fetchWallet(); setShowWallet(true); }} />
            <NavRow icon={<Gift size={16} />} label="Refer & Earn" subtitle="Invite friends, earn rewards" onClick={() => dispatch(addToast({ title: 'Referral Code', message: 'Your code: SHOPYNG50. Share with friends!', type: 'success' }))} />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <NavRow icon={<Star size={16} />} label="My Reviews" subtitle="Products you've rated" onClick={() => dispatch(addToast({ title: 'Coming Soon', message: 'Review management coming soon!', type: 'info' }))} />
            <NavRow icon={<Shield size={16} />} label="Privacy & Security" subtitle="Manage account safety" onClick={() => dispatch(addToast({ title: 'Coming Soon', message: 'Security settings coming soon!', type: 'info' }))} />
            <NavRow icon={<Settings size={16} />} label="App Settings" subtitle="Notifications, language, theme" onClick={() => setShowPreferences(true)} />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <NavRow
              icon={<LogOut size={16} />}
              label="Sign Out"
              subtitle="Log out of your account"
              danger
              onClick={handleLogout}
            />
          </div>

          <p className="text-center font-inter text-[10px] text-slate-300 pb-2">
            ShopYNG v1.0.0 · Terms · Privacy Policy
          </p>
        </motion.div>
      )}

      {/* ── ADDRESSES SECTION ─────────────────────────────── */}
      {activeSection === 'addresses' && (
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
          {addresses.map((addr, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-main/10 flex items-center justify-center flex-shrink-0">
                <MapPin size={16} className="text-primary-main" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-poppins font-bold text-sm text-slate-800">{addr.tag}</span>
                  {idx === 0 && (
                    <span className="text-[10px] font-poppins font-bold bg-primary-main/10 text-primary-main px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="font-inter text-xs text-slate-500 leading-relaxed">
                  {addr.houseNo}, {addr.area}, {addr.pincode}
                  {addr.landmark ? `, Near ${addr.landmark}` : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  dispatch(removeAddress(idx));
                  dispatch(addToast({ title: 'Removed', message: 'Address deleted.', type: 'info' }));
                }}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-500 transition-colors"
                aria-label="Remove address"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {showAddressForm ? (
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <AddressForm
                onSave={handleSaveAddress}
                onCancel={() => setShowAddressForm(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowAddressForm(true)}
              className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-primary-main/30 rounded-2xl text-primary-main font-poppins font-bold text-sm hover:bg-primary-main/5 transition-all"
            >
              <Plus size={16} />
              Add New Address
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};
