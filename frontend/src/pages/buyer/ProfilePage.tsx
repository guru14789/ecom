import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, MapPin, Package, Heart, LogOut, ChevronRight, Edit2, Phone, Mail, Plus, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import type { Address } from '../../types';
import profileBg from '../../assets/profile-bg.png';

export const ProfilePage: React.FC = () => {
  const { user, signOut, signInWithGoogle, setupRecaptcha, requestPhoneOtp } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressIdx, setEditingAddressIdx] = useState<number | null>(null);
  
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const [addressForm, setAddressForm] = useState({
    houseNo: '', area: '', pincode: '', landmark: '', city: '', state: '', tag: 'home' as 'home' | 'work' | 'other',
  });

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    try {
      setPhoneLoading(true);
      setupRecaptcha('send-otp-btn');
      const fullNumber = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      const confirmation = await requestPhoneOtp(fullNumber);
      window.confirmationResult = confirmation;
      setOtpSent(true);
      toast.success('OTP sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast.error('Please enter the OTP');
      return;
    }
    try {
      setPhoneLoading(true);
      const result = await window.confirmationResult.confirm(otp);
      if (result.user) {
        toast.success('Phone verified successfully!');
        setShowPhoneLogin(false);
        setPhoneNumber('');
        setOtp('');
        setOtpSent(false);
      }
    } catch (err: any) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setSavingProfile(true);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profileForm.displayName || null,
        email: profileForm.email || null,
        phone: profileForm.phone || null,
        updatedAt: new Date().toISOString()
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!user || !user.uid) return toast.error('Please login first');
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedAddresses = [...(user.addresses || [])];

      if (editingAddressIdx !== null) {
        updatedAddresses[editingAddressIdx] = { ...addressForm, id: updatedAddresses[editingAddressIdx]?.id || Date.now().toString() };
      } else {
        updatedAddresses.push({ ...addressForm, id: Date.now().toString() });
      }

      await updateDoc(userRef, { addresses: updatedAddresses });
      toast.success(editingAddressIdx !== null ? 'Address updated!' : 'Address added!');
      setShowAddressForm(false);
      setEditingAddressIdx(null);
      setAddressForm({ houseNo: '', area: '', pincode: '', landmark: '', city: '', state: '', tag: 'home' });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (idx: number) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedAddresses = user.addresses.filter((_, i) => i !== idx);
      await updateDoc(userRef, { addresses: updatedAddresses });
      toast.success('Address removed');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to remove address');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gradient-to-br from-green-50 via-blue-50 to-orange-50">
        <div className="max-w-md w-full p-8 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-white text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-green-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <User className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-black text-blue-950 mb-3 tracking-tight">Welcome to shopyng</h2>
            <p className="text-gray-500 mb-8 leading-relaxed text-sm">Login or sign up to view your premium profile, manage orders, and save addresses.</p>
            
            <button
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (err: any) {
                  toast.error(err.message || 'Failed to sign in with Google');
                }
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 px-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 mb-4 active:scale-[0.98]"
            >
              Login with Google
            </button>
            <button
              onClick={() => setShowPhoneLogin(!showPhoneLogin)}
              className="w-full bg-white border-2 border-gray-100 text-gray-700 font-bold py-4 px-4 rounded-xl hover:bg-gray-50 hover:border-blue-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Phone className="h-5 w-5 text-blue-600" /> Login with Phone
            </button>

            {showPhoneLogin && (
              <div className="mt-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                {!otpSent ? (
                  <>
                    <div className="flex gap-2">
                      <span className="flex items-center px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 shadow-sm">+91</span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Phone number"
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none shadow-sm transition-all"
                        maxLength={10}
                      />
                    </div>
                    <button
                      id="send-otp-btn"
                      onClick={handleSendOtp}
                      disabled={phoneLoading}
                      className="w-full bg-blue-950 text-white font-bold py-3 rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-70 shadow-lg shadow-blue-900/20"
                    >
                      {phoneLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none shadow-sm transition-all text-center tracking-[0.5em] font-bold text-lg"
                      maxLength={6}
                    />
                    <button
                      onClick={handleVerifyOtp}
                      disabled={phoneLoading}
                      className="w-full bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-70 shadow-lg shadow-green-500/20"
                    >
                      {phoneLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Decorative Hero Header */}
      <div 
        className="h-64 relative overflow-hidden bg-blue-950 bg-cover bg-center"
        style={{ backgroundImage: `url(${profileBg})` }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: User Card & Navigation */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* User Profile Card */}
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-white flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-500 to-orange-500"></div>
              
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-orange-50 hover:text-orange-500 transition-colors shadow-sm"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              
              <div className="w-28 h-28 bg-gradient-to-br from-blue-100 to-green-100 rounded-full mb-5 overflow-hidden border-4 border-white shadow-lg relative group-hover:scale-105 transition-transform duration-500">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-500">
                    <User className="h-12 w-12" />
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="w-full space-y-4 mb-4 text-left">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                    <input type="text" value={profileForm.displayName} onChange={e => setProfileForm(p => ({...p, displayName: e.target.value}))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                    <input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({...p, email: e.target.value}))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                    <input type="text" value={profileForm.phone} onChange={e => setProfileForm(p => ({...p, phone: e.target.value}))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleSaveProfile} disabled={savingProfile} className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-orange-600 transition-colors">
                      {savingProfile ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => { setIsEditing(false); setProfileForm({ displayName: user.displayName || '', email: user.email || '', phone: user.phone || '' }); }} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-black text-blue-950 mb-1">{user.displayName || 'Add your name'}</h2>
                  <p className="text-gray-500 text-sm flex items-center gap-1.5 justify-center mb-1">
                    <Mail className="h-3.5 w-3.5 text-orange-400" /> {user.email || 'No email'}
                  </p>
                  <p className="text-gray-500 text-sm flex items-center gap-1.5 justify-center mb-4">
                    <Phone className="h-3.5 w-3.5 text-green-500" /> {user.phone || 'No phone'}
                  </p>
                  
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 uppercase tracking-widest border border-blue-100">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    {user.role}
                  </span>
                </>
              )}
            </div>

            {/* Navigation Menu */}
            <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-blue-900/5 border border-white overflow-hidden p-2">
              <Link to="/orders" className="flex items-center justify-between p-4 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="font-bold text-gray-700 group-hover:text-blue-900">My Orders</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </Link>
              
              <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-orange-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <MapPin className="h-5 w-5 text-orange-500" />
                  </div>
                  <span className="font-bold text-gray-700 group-hover:text-orange-900">Saved Addresses</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-green-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <Heart className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="font-bold text-gray-700 group-hover:text-green-900">Favorites</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 p-4 bg-white border-2 border-gray-100 text-gray-500 font-bold rounded-[1.5rem] hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>

          {/* Right Column: Main Content (Addresses) */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-2xl font-black text-blue-950 tracking-tight">Saved Addresses</h3>
                  <p className="text-gray-500 text-sm mt-1">Manage where your groceries will be delivered.</p>
                </div>
                <button
                  onClick={() => { setShowAddressForm(true); setEditingAddressIdx(null); setAddressForm({ houseNo: '', area: '', pincode: '', landmark: '', city: '', state: '', tag: 'home' }); }}
                  className="bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Plus className="h-5 w-5" /> Add New
                </button>
              </div>

              {showAddressForm && (
                <div className="mb-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-inner">
                  <h4 className="font-bold text-blue-950 mb-4 text-lg">{editingAddressIdx !== null ? 'Edit Address' : 'New Address Details'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">House / Flat No.</label>
                      <input type="text" value={addressForm.houseNo} onChange={(e) => setAddressForm(p => ({ ...p, houseNo: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all shadow-sm" placeholder="e.g. Flat 4B" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Area / Street</label>
                      <input type="text" value={addressForm.area} onChange={(e) => setAddressForm(p => ({ ...p, area: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all shadow-sm" placeholder="e.g. MG Road" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">City</label>
                      <input type="text" value={addressForm.city} onChange={(e) => setAddressForm(p => ({ ...p, city: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">State</label>
                      <input type="text" value={addressForm.state} onChange={(e) => setAddressForm(p => ({ ...p, state: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Pincode</label>
                      <input type="text" value={addressForm.pincode} onChange={(e) => setAddressForm(p => ({ ...p, pincode: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all shadow-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tag</label>
                      <select value={addressForm.tag} onChange={(e) => setAddressForm(p => ({ ...p, tag: e.target.value as any }))}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all shadow-sm appearance-none">
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Landmark (Optional)</label>
                      <input type="text" value={addressForm.landmark || ''} onChange={(e) => setAddressForm(p => ({ ...p, landmark: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-all shadow-sm" placeholder="e.g. Near City Hospital" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={handleSaveAddress} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-sm hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20 transition-all">
                      Save Address
                    </button>
                    <button onClick={() => setShowAddressForm(false)} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {user.addresses?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.addresses.map((address, index) => (
                    <div key={index} className="p-5 bg-white border-2 border-gray-100 rounded-2xl hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5 transition-all group relative">
                      {index === 0 && (
                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-400 to-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-wider border-2 border-white">
                          Default
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <span className="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">
                          {address.tag}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 font-bold mb-1">{address.houseNo}, {address.area}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{address.city}, {address.state}</p>
                      <p className="text-gray-500 text-sm font-medium mb-3">{address.pincode}</p>
                      
                      {address.landmark && <p className="text-gray-400 text-xs italic bg-gray-50 inline-block px-2 py-1 rounded">Near {address.landmark}</p>}
                      
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingAddressIdx(index); setAddressForm(address); setShowAddressForm(true); }}
                          className="flex-1 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-100 transition-colors text-center"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(index)}
                          className="flex-1 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem]">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <MapPin className="h-10 w-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No addresses saved</h3>
                  <p className="text-gray-500 mb-6 text-sm max-w-xs mx-auto">You haven't added any delivery addresses yet.</p>
                  <button
                    onClick={() => { setShowAddressForm(true); setEditingAddressIdx(null); setAddressForm({ houseNo: '', area: '', pincode: '', landmark: '', city: '', state: '', tag: 'home' }); }}
                    className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                  >
                    Add Your First Address
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
