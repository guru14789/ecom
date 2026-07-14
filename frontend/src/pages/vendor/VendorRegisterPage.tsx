import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { vendorApi } from '../../lib/api';
import { toast } from 'react-hot-toast';
import {
  Building2, Store, MapPin, CreditCard, FileText, CheckCircle,
  ChevronRight, ChevronLeft, Upload, Eye, EyeOff, AlertCircle,
  Loader2, ShieldCheck, Package, TrendingUp,
} from 'lucide-react';
import { z } from 'zod';
import logo from '../../assets/logo.png';

// ─── Step Config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Business & KYC', icon: Building2,  title: 'Business Information', subtitle: 'Tell us about your business entity' },
  { id: 2, label: 'Store',      icon: Store,       title: 'Store Identity',       subtitle: 'Build your brand on shopsyy' },
  { id: 3, label: 'Addresses',  icon: MapPin,      title: 'Business Addresses',   subtitle: 'Where you operate from' },
  { id: 4, label: 'Bank & Payouts',icon: CreditCard,title: 'Payout Details',       subtitle: 'How you want to receive payments' },
  { id: 5, label: 'DigiLocker', icon: ShieldCheck, title: 'DigiLocker Auth',      subtitle: 'Optional extended verification' },
  { id: 6, label: 'Review',     icon: CheckCircle, title: 'Review & Submit',      subtitle: 'Final review before submission' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const InputField: React.FC<{
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; placeholder?: string; type?: string;
  hint?: string; error?: string; pattern?: string;
}> = ({ label, name, value, onChange, required, placeholder, type = 'text', hint, error, pattern }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type} name={name} value={value} onChange={onChange}
      required={required} placeholder={placeholder} pattern={pattern}
      className={`w-full px-4 py-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
        error ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-primary focus:ring-primary/20'
      }`}
    />
    {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

const TextAreaField: React.FC<{
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number; placeholder?: string; hint?: string;
}> = ({ label, name, value, onChange, rows = 3, placeholder, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <textarea
      name={name} value={value} onChange={onChange} rows={rows} placeholder={placeholder}
      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 resize-none"
    />
    {hint && <p className="text-xs text-gray-500">{hint}</p>}
  </div>
);

// ─── Subcomponents ─────────────────────────────────────────────────────────────
const AddressForm = ({ prefix, state, setState, title }: {
  prefix: string; state: any; setState: any; title: string;
}) => (
  <div className="space-y-4">
    <h4 className="font-semibold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
      <MapPin className="h-4 w-4 text-primary" />{title}
    </h4>
    <InputField label="Address Line 1" name="line1" value={state.line1}
      onChange={e => setState((p: any) => ({ ...p, line1: e.target.value }))}
      required placeholder="Street address, building, flat no." />
    <InputField label="Address Line 2" name="line2" value={state.line2}
      onChange={e => setState((p: any) => ({ ...p, line2: e.target.value }))}
      placeholder="Area, locality (optional)" />
    <div className="grid grid-cols-2 gap-4">
      <InputField label="City" name="city" value={state.city}
        onChange={e => setState((p: any) => ({ ...p, city: e.target.value }))} required />
      <InputField label="State" name="state" value={state.state}
        onChange={e => setState((p: any) => ({ ...p, state: e.target.value }))} required />
      <InputField label="Pincode" name="pincode" value={state.pincode}
        onChange={e => setState((p: any) => ({ ...p, pincode: e.target.value }))} required pattern="\d{6}" />
      <InputField label="Country" name="country" value={state.country}
        onChange={e => setState((p: any) => ({ ...p, country: e.target.value }))} />
    </div>
  </div>
);

// KycUploadCard removed as per new automated verification requirements.

// ─── Main Component ────────────────────────────────────────────────────────────
export const VendorRegisterPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [business, setBusiness] = useState({ businessName: '', gstin: '', pan: '', vatNumber: '' });
  const [store, setStore] = useState({ storeName: '', storeSlug: '', description: '', logo: '', banner: '' });
  const [addresses, setAddresses] = useState({
    address: { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
    pickupAddress: { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
    returnAddress: { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
    useSameForPickup: true,
    useSameForReturn: true,
  });
  const [bank, setBank] = useState({ accountNo: '', ifsc: '', beneficiaryName: '', upiId: '' });
  
  // Verification states
  const [verified, setVerified] = useState({
    mobile: true, // Mocked as true since they are signed in
    gst: false,
    pan: false,
    bank: false,
    digilocker: false
  });
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});

  const update = useCallback((setter: React.Dispatch<React.SetStateAction<any>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      toast.loading(`Uploading ${field}...`, { id: `upload-${field}` });

      const { auth } = await import('../../lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/vendor/upload/cloudflare-url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, imageId, hash } = await response.json();

      const formData = new FormData();
      formData.append('file', file);

      const cfResponse = await fetch(uploadUrl, { method: 'POST', body: formData });
      if (!cfResponse.ok) throw new Error(`Failed to upload ${field} to Cloudflare`);
      
      const publicUrl = `https://imagedelivery.net/${hash}/${imageId}/public`;
      
      setStore(prev => ({ ...prev, [field]: publicUrl }));
      toast.success(`${field} uploaded successfully!`, { id: `upload-${field}` });
    } catch (error: any) {
      console.error(`${field} upload error:`, error);
      toast.error(`Failed to upload ${field}`, { id: `upload-${field}` });
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 1: Business & KYC ─────────────────────────────────────────────────
  const handleStep1 = async () => {
    if (!user) { toast.error('Please sign in first'); navigate('/profile'); return; }
    
    // Check if verified if they provided GST/PAN
    if (business.gstin && !verified.gst) return toast.error('Please verify your GSTIN first');
    if (business.pan && !verified.pan) return toast.error('Please verify your PAN first');

    try {
      setLoading(true);
      // Initiate vendor profile
      const initiateRes: any = await vendorApi.register.initiate({
        fullName: user.displayName || user.phone || 'Vendor',
        email: user.email || '',
        phoneNumber: user.phone || '',
        businessName: business.businessName,
        storeName: store.storeName || business.businessName,
        storeSlug: store.storeSlug || generateSlug(business.businessName),
      });

      let currentVendorId = vendorId;
      if (initiateRes.success) {
        currentVendorId = initiateRes.data.vendorId;
        setVendorId(currentVendorId);
      }

      if (currentVendorId) {
        // Save business info (GST, PAN, VAT)
        await vendorApi.register.updateBusiness(currentVendorId, {
          businessName: business.businessName,
          gstin: business.gstin || undefined,
          pan: business.pan || undefined,
          vatNumber: business.vatNumber || undefined,
        });
        setStep(2);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save business information');
    } finally { setLoading(false); }
  };

  // ─── Step 2: Store Identity ─────────────────────────────────────────────────
  const handleStep2 = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      await vendorApi.register.updateStore(vendorId, {
        storeName: store.storeName,
        storeSlug: store.storeSlug,
        description: store.description,
        logo: store.logo || undefined,
        banner: store.banner || undefined,
      });
      setStep(3);
    } catch (err: any) { toast.error(err.message || 'Failed to save store info');
    } finally { setLoading(false); }
  };

  // ─── Step 3: Addresses ──────────────────────────────────────────────────────
  const handleStep3 = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const pickupAddr = addresses.useSameForPickup ? addresses.address : addresses.pickupAddress;
      const returnAddr = addresses.useSameForReturn ? addresses.address : addresses.returnAddress;
      await vendorApi.register.updateAddresses(vendorId, {
        address: addresses.address,
        pickupAddress: pickupAddr,
        returnAddress: returnAddr,
        warehouseAddress: pickupAddr,
      });
      setStep(4);
    } catch (err: any) { toast.error(err.message || 'Failed to save addresses');
    } finally { setLoading(false); }
  };

  // ─── Step 4: Bank Details ───────────────────────────────────────────────────
  const handleStep4 = async () => {
    if (!vendorId) return;
    if (!verified.bank) return toast.error('Please verify your bank account first');
    try {
      setLoading(true);
      await vendorApi.register.updateBank(vendorId, bank);
      setStep(5);
    } catch (err: any) { toast.error(err.message || 'Failed to save bank details');
    } finally { setLoading(false); }
  };

  // ─── Verification Handlers ───────────────────────────────────────────────────
  const verifyGst = async () => {
    if (!business.gstin) return toast.error('Enter GSTIN first');
    try {
      z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i, 'Invalid GSTIN format').parse(business.gstin);
    } catch (err: any) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
      return toast.error('Invalid GSTIN');
    }

    setVerifying(p => ({ ...p, gst: true }));
    try {
      const res: any = await vendorApi.register.verifyGst({ gstin: business.gstin });
      setBusiness(p => ({ ...p, businessName: res.data.legalName }));
      setVerified(p => ({ ...p, gst: true }));
      toast.success('GST Verified Successfully!');
    } catch (err: any) { toast.error(err.message || 'GST Verification failed'); }
    finally { setVerifying(p => ({ ...p, gst: false })); }
  };

  const verifyPan = async () => {
    if (!business.pan) return toast.error('Enter PAN first');
    try {
      z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'Invalid PAN format').parse(business.pan);
    } catch (err: any) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
      return toast.error('Invalid PAN');
    }

    setVerifying(p => ({ ...p, pan: true }));
    try {
      await vendorApi.register.verifyPan({ pan: business.pan, name: business.businessName });
      setVerified(p => ({ ...p, pan: true }));
      toast.success('PAN Verified Successfully!');
    } catch (err: any) { toast.error(err.message || 'PAN Verification failed'); }
    finally { setVerifying(p => ({ ...p, pan: false })); }
  };

  const verifyBankAccount = async () => {
    if (!vendorId) return;
    try {
      z.object({
        accountNo: z.string().min(9, 'Invalid Account Number').max(18, 'Invalid Account Number'),
        ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'Invalid IFSC Code')
      }).parse({ accountNo: bank.accountNo, ifsc: bank.ifsc });
    } catch (err: any) {
      if (err instanceof z.ZodError) return toast.error(err.errors[0].message);
      return toast.error('Invalid Bank Details');
    }

    setVerifying(p => ({ ...p, bank: true }));
    try {
      // Save details first
      await vendorApi.register.updateBank(vendorId, bank);
      // Then verify via Penny Drop
      const res: any = await vendorApi.register.verifyBank(vendorId);
      setBank(p => ({ ...p, beneficiaryName: res.data.accountHolderName }));
      setVerified(p => ({ ...p, bank: true }));
      toast.success('Bank Account Verified via Penny Drop!');
    } catch (err: any) { toast.error(err.message || 'Bank Verification failed'); }
    finally { setVerifying(p => ({ ...p, bank: false })); }
  };

  const verifyDigilocker = async () => {
    setVerifying(p => ({ ...p, digilocker: true }));
    try {
      // Mock OAuth flow delay
      await new Promise(r => setTimeout(r, 1500));
      setVerified(p => ({ ...p, digilocker: true }));
      toast.success('DigiLocker authenticated successfully!');
      setStep(6);
    } catch (err: any) { toast.error('DigiLocker authentication failed'); }
    finally { setVerifying(p => ({ ...p, digilocker: false })); }
  };

  const handleFinalSubmit = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const res: any = await vendorApi.register.submit(vendorId, {
        mobileVerified: verified.mobile,
        gstVerified: verified.gst,
        panVerified: verified.pan,
        bankVerified: verified.bank,
        digilockerVerified: verified.digilocker,
      });
      toast.success(`Registration submitted! Trust Score: ${res.trustScore}. Status: ${res.registrationStatus}`);
      navigate('/vendor/onboarding-status');
    } catch (err: any) { toast.error(err.message || 'Failed to submit registration');
    } finally { setLoading(false); }
  };



  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/5 flex flex-col md:flex-row w-full max-w-5xl overflow-hidden min-h-[600px] border border-gray-100">
        
        {/* LEFT SIDEBAR: Vertical Stepper */}
        <div className="w-full md:w-1/3 bg-green-50/40 p-8 md:p-10 border-r border-gray-100 flex flex-col relative">
          <a href="/" className="flex items-center gap-4 mb-10 z-10 w-max bg-white/60 px-4 py-3 rounded-2xl backdrop-blur-sm border border-white/40 shadow-sm">
            <img src={logo} alt="shopyng" className="h-14 w-auto" />
            <span className="text-orange-500 text-base font-black uppercase tracking-widest border-l-2 border-orange-200 pl-4">Seller</span>
          </a>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-10 z-10">Create account</h1>
          
          <div className="flex-1 relative pl-2">
             {/* Vertical connecting line */}
             <div className="absolute left-[23px] top-4 bottom-8 w-[2px] bg-gray-200 z-0"></div>
             
             <div className="space-y-8 relative z-10">
               {STEPS.map((s, i) => {
                  const isActive = step === s.id;
                  const isDone = step > s.id;
                  return (
                    <div key={s.id} className="flex items-start gap-4">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300 ${
                          isActive || isDone 
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-white' 
                            : 'bg-gray-100 text-gray-400 border-2 border-gray-200 ring-4 ring-white'
                       }`}>
                         {isDone ? <CheckCircle className="w-4 h-4" /> : s.id}
                       </div>
                       <div className="pt-1">
                         <p className={`font-bold transition-colors duration-300 ${isActive || isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                           {s.label}
                         </p>
                       </div>
                    </div>
                  );
               })}
             </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-100/50 to-transparent pointer-events-none" />
        </div>

        {/* RIGHT COLUMN: Form Content */}
        <div className="w-full md:w-2/3 p-8 md:p-12 flex flex-col bg-white">
          <div className="flex-1 max-w-xl">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-8">
              {STEPS[step - 1].title}
            </h2>
            
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              {/* ── Step 1: Business Info ───────────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
                    <p>Enter your GST and PAN. We will automatically fetch your business details.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-1 w-full">
                        <InputField label="GSTIN" name="gstin" value={business.gstin}
                          onChange={update(setBusiness)} placeholder="15-digit GST Number" />
                      </div>
                      <button onClick={verifyGst} disabled={verifying.gst || verified.gst || !business.gstin}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        {verifying.gst ? <Loader2 className="w-4 h-4 animate-spin" /> : verified.gst ? <CheckCircle className="w-4 h-4" /> : 'Verify'}
                      </button>
                    </div>
                    {verified.gst && <p className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> GST Verified</p>}
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-1 w-full">
                        <InputField label="PAN Number" name="pan" value={business.pan}
                          onChange={update(setBusiness)} placeholder="10-character PAN" />
                      </div>
                      <button onClick={verifyPan} disabled={verifying.pan || verified.pan || !business.pan}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        {verifying.pan ? <Loader2 className="w-4 h-4 animate-spin" /> : verified.pan ? <CheckCircle className="w-4 h-4" /> : 'Verify'}
                      </button>
                    </div>
                    {verified.pan && <p className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> PAN Verified</p>}
                  </div>

                  <InputField label="Legal Business Name" name="businessName" value={business.businessName}
                    onChange={update(setBusiness)} required placeholder="Auto-filled via GST Verification" />
                    
                  <InputField label="VAT Number" name="vatNumber" value={business.vatNumber}
                    onChange={update(setBusiness)} placeholder="Optional — for non-GST registered businesses" />
                </div>
              )}

              {/* ── Step 2: Store Identity ──────────────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InputField label="Store Name" name="storeName" value={store.storeName}
                      onChange={e => {
                        update(setStore)(e);
                        setStore(p => ({ ...p, storeSlug: p.storeSlug || generateSlug(e.target.value) }));
                      }} required placeholder="e.g. FreshMart Organics" />
                    <InputField label="Store URL Slug" name="storeSlug" value={store.storeSlug}
                      onChange={update(setStore)} required placeholder="freshmart-organics"
                      hint={`Your store: shopsyy.com/store/${store.storeSlug || 'your-store'}`} />
                  </div>
                  <TextAreaField label="Store Description" name="description" value={store.description}
                    onChange={update(setStore)} placeholder="Tell customers what makes your store unique..."
                    hint="Will be displayed on your public storefront (max 1000 chars)" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Logo Image</label>
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'logo')} 
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      <p className="text-xs text-gray-500">Square image recommended (min 200×200px)</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Banner Image</label>
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'banner')}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      <p className="text-xs text-gray-500">Wide image recommended (1200×300px)</p>
                    </div>
                  </div>
                  {/* Logo/Banner Preview */}
                  {(store.logo || store.banner) && (
                    <div className="rounded-xl overflow-hidden border bg-gray-50 mt-4">
                      {store.banner && <img src={store.banner} alt="Banner" className="w-full h-24 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
                      <div className="p-3 flex items-center gap-3">
                        {store.logo && <img src={store.logo} alt="Logo" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow" onError={e => (e.currentTarget.style.display = 'none')} />}
                        <div><p className="font-bold text-gray-900 text-sm">{store.storeName || 'Store Preview'}</p><p className="text-xs text-gray-500">@{store.storeSlug || 'store-slug'}</p></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 3: Addresses ───────────────────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-6">
                  <AddressForm prefix="address" state={addresses.address}
                    setState={(fn: any) => setAddresses(p => ({ ...p, address: fn(p.address) }))}
                    title="Registered Business Address" />

                  <div className="border-t border-gray-100 pt-6">
                    <label className="flex items-center gap-3 cursor-pointer mb-6">
                      <input type="checkbox" checked={addresses.useSameForPickup}
                        onChange={e => setAddresses(p => ({ ...p, useSameForPickup: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-semibold text-gray-700">Pickup address same as business address</span>
                    </label>
                    {!addresses.useSameForPickup && (
                      <AddressForm prefix="pickup" state={addresses.pickupAddress}
                        setState={(fn: any) => setAddresses(p => ({ ...p, pickupAddress: fn(p.pickupAddress) }))}
                        title="Pickup Address" />
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <label className="flex items-center gap-3 cursor-pointer mb-6">
                      <input type="checkbox" checked={addresses.useSameForReturn}
                        onChange={e => setAddresses(p => ({ ...p, useSameForReturn: e.target.checked }))}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-semibold text-gray-700">Return address same as business address</span>
                    </label>
                    {!addresses.useSameForReturn && (
                      <AddressForm prefix="return" state={addresses.returnAddress}
                        setState={(fn: any) => setAddresses(p => ({ ...p, returnAddress: fn(p.returnAddress) }))}
                        title="Return Address" />
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 4: Bank Details ────────────────────────────────────────── */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
                    <p>Enter your account details. We will perform a Penny Drop verification to instantly verify your account and fetch the beneficiary name.</p>
                  </div>
                  <InputField label="Account Number" name="accountNo" value={bank.accountNo}
                    onChange={update(setBank)} required placeholder="Enter your bank account number" type="password" />
                  <InputField label="IFSC Code" name="ifsc" value={bank.ifsc}
                    onChange={update(setBank)} required placeholder="e.g. SBIN0001234"
                    hint="11-character bank branch code" />
                    
                  <button onClick={verifyBankAccount} disabled={verifying.bank || verified.bank || !bank.accountNo || !bank.ifsc}
                    className="w-full py-3.5 mt-2 rounded-xl font-bold bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {verifying.bank ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying Bank via Penny Drop...</> : verified.bank ? <><CheckCircle className="w-5 h-5" /> Account Verified</> : 'Verify Account via Penny Drop'}
                  </button>

                  {verified.bank && (
                    <div className="animate-in fade-in pt-4">
                      <InputField label="Verified Beneficiary Name" name="beneficiaryName" value={bank.beneficiaryName}
                        onChange={update(setBank)} required placeholder="Auto-filled via Penny Drop" />
                    </div>
                  )}

                  <InputField label="UPI ID (Optional)" name="upiId" value={bank.upiId}
                    onChange={update(setBank)} placeholder="vendor@paytm or vendor@upi" />
                </div>
              )}

              {/* ── Step 5: DigiLocker Verification ─────────────────────────────── */}
              {step === 5 && (
                <div className="space-y-8 text-center py-8">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Boost Your Trust Score</h3>
                  <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    Connecting with DigiLocker securely verifies your identity without storing any physical documents. This significantly improves your Vendor Trust Score and speeds up the approval process.
                  </p>
                  
                  <div className="pt-8">
                    <button onClick={verifyDigilocker} disabled={verifying.digilocker || verified.digilocker}
                      className="mx-auto px-8 py-4 rounded-xl font-bold bg-[#002e6b] text-white hover:bg-[#001f4a] disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20">
                      {verifying.digilocker ? <Loader2 className="w-5 h-5 animate-spin" /> : verified.digilocker ? <CheckCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      {verified.digilocker ? 'DigiLocker Connected' : 'Verify with DigiLocker'}
                    </button>
                    {!verified.digilocker && (
                      <button onClick={() => setStep(6)} className="mt-6 text-sm text-gray-500 font-semibold hover:text-gray-900">
                        Skip for now
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 6: Review & Submit ─────────────────────────────────────── */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-green-500" />
                    <p>You are almost done! Review your details below and click Submit.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { title: 'Business Details', items: [
                        { label: 'Business Name', value: business.businessName },
                        { label: 'GSTIN', value: business.gstin || 'Not provided' },
                        { label: 'PAN', value: business.pan || 'Not provided' },
                      ]},
                      { title: 'Store Identity', items: [
                        { label: 'Store Name', value: store.storeName },
                        { label: 'Store URL', value: `shopsyy.com/store/${store.storeSlug}` },
                      ]},
                      { title: 'Bank Details', items: [
                        { label: 'Beneficiary', value: bank.beneficiaryName },
                        { label: 'IFSC', value: bank.ifsc },
                      ]},
                    ].map(section => (
                      <div key={section.title} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-5 py-3 border-b border-gray-100">
                          <p className="font-bold text-gray-800 text-xs uppercase tracking-wider">{section.title}</p>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {section.items.map(item => (
                            <div key={item.label} className="px-5 py-3 flex justify-between text-sm">
                              <span className="text-gray-500">{item.label}</span>
                              <span className="font-semibold text-gray-900">
                                {item.label === 'Account Number' && item.value.length > 4 
                                  ? `XXXX-XXXX-${item.value.slice(-4)}` 
                                  : item.label === 'PAN' && item.value.length > 4
                                  ? `XXXXXX${item.value.slice(-4)}`
                                  : item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border border-green-200 bg-green-50 rounded-xl p-5 shadow-inner">
                    <h4 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Trust Score Calculation</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs text-green-800">
                      <div className="flex justify-between border-b border-green-200/50 pb-1"><span>Mobile Verified</span> <span className="font-bold">{verified.mobile ? '+20' : '0'}</span></div>
                      <div className="flex justify-between border-b border-green-200/50 pb-1"><span>GST Verified</span> <span className="font-bold">{verified.gst ? '+30' : '0'}</span></div>
                      <div className="flex justify-between border-b border-green-200/50 pb-1"><span>PAN Verified</span> <span className="font-bold">{verified.pan ? '+20' : '0'}</span></div>
                      <div className="flex justify-between border-b border-green-200/50 pb-1"><span>Bank Penny Drop</span> <span className="font-bold">{verified.bank ? '+20' : '0'}</span></div>
                      <div className="flex justify-between col-span-2 border-b border-green-200/50 pb-1"><span>DigiLocker Auth</span> <span className="font-bold">{verified.digilocker ? '+10' : '0'}</span></div>
                      <div className="flex justify-between col-span-2 text-sm text-green-900 mt-2">
                        <span className="font-bold">Total Estimated Score</span> 
                        <span className="font-black text-lg">
                          {(verified.mobile ? 20 : 0) + (verified.gst ? 30 : 0) + (verified.pan ? 20 : 0) + (verified.bank ? 20 : 0) + (verified.digilocker ? 10 : 0)} / 100
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 text-center px-4 pt-2">
                    By submitting, you agree to shopsyy's <a href="#" className="text-blue-600 hover:underline">Seller Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/')}
              className="text-gray-500 font-bold hover:text-gray-900 transition-colors px-2 py-2 text-sm"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            <button
              onClick={
                step === 1 ? handleStep1 :
                step === 2 ? handleStep2 :
                step === 3 ? handleStep3 :
                step === 4 ? handleStep4 :
                step === 5 ? () => setStep(6) :
                handleFinalSubmit
              }
              disabled={loading || (step === 1 && !business.businessName)}
              className="flex items-center justify-center gap-2 px-10 py-3.5 rounded-full text-sm font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 transition-all shadow-lg shadow-orange-500/30 min-w-[140px]"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (step === 6 ? 'Submit' : 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

