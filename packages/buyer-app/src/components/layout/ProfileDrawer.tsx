import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Package, Heart, Gift, LogOut, Copy, Share2, Wallet, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setProfileOpen, setAddressModalOpen, addToast } from '../../store/slices/uiSlice';
import { logoutUser, removeAddress } from '../../store/slices/authSlice';
import { Drawer } from '../ui/Drawer';

export const ProfileDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isOpen = useAppSelector((state) => state.ui.isProfileOpen);
  const user = useAppSelector((state) => state.auth.user);
  const addresses = useAppSelector((state) => state.auth.addresses);
  const orders = useAppSelector((state) => state.auth.orders);
  const walletBalance = useAppSelector((state) => state.auth.walletBalance);
  const referralCode = useAppSelector((state) => state.auth.referralCode);
  const referredCount = useAppSelector((state) => state.auth.referredCount);

  const [activeTab, setActiveTab] = useState<'options' | 'addresses' | 'orders' | 'rewards'>('options');

  const handleClose = () => {
    dispatch(setProfileOpen(false));
    setActiveTab('options');
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(setProfileOpen(false));
    dispatch(addToast({
      title: 'Logged Out',
      message: 'You have logged out successfully',
      type: 'info'
    }));
    navigate('/');
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    dispatch(addToast({
      title: 'Copied!',
      message: 'Referral code copied to clipboard',
      type: 'success'
    }));
  };

  const handleAddressRemove = (index: number) => {
    dispatch(removeAddress(index));
    dispatch(addToast({
      title: 'Address Removed',
      message: 'Delivery location removed successfully',
      type: 'success'
    }));
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="My Dashboard">
      <div className="flex flex-col h-full justify-between">
        {/* User Card Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 bg-white/70 border border-primary-main/15 p-4 rounded-3xl shadow-sm">
            <div className="w-14 h-14 rounded-full bg-primary-main/15 flex items-center justify-center border border-primary-light overflow-hidden">
              <img src="/profile.png" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="font-poppins font-bold text-slate-800 leading-snug truncate">
                {user?.fullName || 'John Doe'}
              </h4>
              <p className="font-inter text-xs text-slate-500 font-medium">
                {user?.phoneNumber || '+91 99999 99999'}
              </p>
            </div>
          </div>

          {/* Quick Wallet Credits Widget */}
          <div className="flex items-center justify-between bg-gradient-to-r from-primary-main to-primary-light text-white p-4.5 rounded-3xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Wallet size={20} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-inter text-[10px] uppercase font-bold tracking-wider opacity-90">Wallet Credits</span>
                <span className="font-poppins font-bold text-xl leading-none">₹{walletBalance}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('rewards')}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Tab Options */}
        <div className="flex-1 my-6 overflow-y-auto pr-1">
          {activeTab === 'options' && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('addresses')}
                className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary-main/20 hover:bg-primary-main/5 text-slate-700 hover:text-slate-900 shadow-sm transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="font-poppins font-bold text-sm">Delivery Locations</span>
                  <span className="font-inter text-xs text-slate-400 font-medium">{addresses.length} Addresses Saved</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary-main/20 hover:bg-primary-main/5 text-slate-700 hover:text-slate-900 shadow-sm transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Package size={18} />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="font-poppins font-bold text-sm">My Purchases</span>
                  <span className="font-inter text-xs text-slate-400 font-medium">{orders.length} Past Invoices</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('rewards')}
                className="flex items-center gap-4 w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary-main/20 hover:bg-primary-main/5 text-slate-700 hover:text-slate-900 shadow-sm transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Gift size={18} />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="font-poppins font-bold text-sm">Rewards & Referrals</span>
                  <span className="font-inter text-xs text-slate-400 font-medium">Earn ₹50 per friend</span>
                </div>
              </button>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <button onClick={() => setActiveTab('options')} className="text-primary-main text-xs font-bold font-poppins flex items-center gap-1"><ArrowLeft size={12} /> Back</button>
                <button
                  onClick={() => dispatch(setAddressModalOpen(true))}
                  className="bg-primary-main hover:bg-primary-hover text-white text-xs font-bold font-poppins px-3 py-1.5 rounded-full"
                >
                  + Add Address
                </button>
              </div>

              {addresses.length === 0 ? (
                <p className="text-center font-inter text-sm text-slate-500 py-8">No saved addresses</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {addresses.map((address, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-poppins font-bold text-xs uppercase text-slate-400">{address.tag}</span>
                        <span className="font-inter text-sm font-semibold text-slate-800 truncate">{address.houseNo}</span>
                        <span className="font-inter text-xs text-slate-500 truncate">{address.area}, {address.pincode}</span>
                      </div>
                      <button
                        onClick={() => handleAddressRemove(idx)}
                        className="text-red-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="flex flex-col gap-4">
              <button onClick={() => setActiveTab('options')} className="text-primary-main text-xs font-bold font-poppins self-start flex items-center gap-1"><ArrowLeft size={12} /> Back</button>

              {orders.length === 0 ? (
                <p className="text-center font-inter text-sm text-slate-500 py-8">No orders placed yet</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-poppins font-bold text-xs text-slate-400">Order ID: #{order.id}</span>
                        <span className="bg-primary-main/10 text-primary-main text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {order.status}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-b border-slate-100 py-2 my-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-xs text-slate-600">
                            <span className="truncate max-w-[200px] font-medium">{item.product.name} x{item.quantity}</span>
                            <span className="font-semibold text-slate-800">₹{(item.isGroupBuy ? item.product.groupPrice : item.product.price) * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center font-poppins text-sm font-bold text-slate-800">
                        <span>Total Paid</span>
                        <span className="text-primary-main">₹{order.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="flex flex-col gap-4">
              <button onClick={() => setActiveTab('options')} className="text-primary-main text-xs font-bold font-poppins self-start flex items-center gap-1"><ArrowLeft size={12} /> Back</button>

              <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-full bg-accent-orange/10 flex items-center justify-center text-accent-orange animate-bounce-subtle">
                  <Gift size={24} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="font-poppins font-bold text-base text-slate-800">Invite & Earn Credits</h4>
                  <p className="font-inter text-xs text-slate-500 leading-relaxed">
                    Share your unique referral code. Get ₹50 in your wallet as soon as they complete their first order!
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 justify-between">
                  <code className="font-poppins font-bold text-sm text-slate-800 tracking-wider px-2">{referralCode}</code>
                  <button
                    onClick={handleCopyReferral}
                    className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 hover:text-slate-800"
                    title="Copy Code"
                  >
                    <Copy size={16} />
                  </button>
                </div>

                <div className="border-t border-slate-100 w-full pt-4 mt-2 flex justify-around text-xs text-slate-600 font-inter">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-base text-slate-800">{referredCount}</span>
                    <span>Referred Friends</span>
                  </div>
                  <div className="w-px bg-slate-200" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-base text-slate-800">₹{referredCount * 50}</span>
                    <span>Total Cash Earned</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Logout Footer */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 font-poppins font-bold py-4.5 rounded-2xl border border-red-200 transition-colors"
        >
          <LogOut size={16} />
          Logout Account
        </button>
      </div>
    </Drawer>
  );
};
