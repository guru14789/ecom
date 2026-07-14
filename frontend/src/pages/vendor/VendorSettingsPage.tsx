import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { Store, MapPin, Clock, DollarSign, Save, Upload, Ban } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface VendorSettings {
  storeName: string;
  storeSlug: string;
  description: string;
  logo: string;
  banner: string;
  address: string;
  pincode: string;
  deliveryRadiusKm: number;
  minOrderValue: number;
  deliveryFee: number;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  bankAccountNumber: string;
  ifscCode: string;
  upiId: string;
}

export const VendorSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<VendorSettings>({
    storeName: '', storeSlug: '', description: '', logo: '', banner: '',
    address: '', pincode: '', deliveryRadiusKm: 5, minOrderValue: 0,
    deliveryFee: 25, isOpen: true, openingTime: '06:00', closingTime: '23:00',
    bankAccountNumber: '', ifscCode: '', upiId: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'vendors', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as VendorSettings;
          setForm(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const docRef = doc(db, 'vendors', user.uid);
      await setDoc(docRef, {
        ...form,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const update = (key: keyof VendorSettings, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-blue-950 tracking-tight">Store Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your storefront details, delivery zones, and payout info.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-gray-400" /> Basic Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                  <input type="text" value={form.storeName} onChange={(e) => update('storeName', e.target.value)}
                    className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Slug</label>
                  <input type="text" value={form.storeSlug} onChange={(e) => update('storeSlug', e.target.value)}
                    className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                  <input type="url" value={form.logo} onChange={(e) => update('logo', e.target.value)}
                    className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner URL</label>
                  <input type="url" value={form.banner} onChange={(e) => update('banner', e.target.value)}
                    className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" /> Location & Delivery
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => update('address', e.target.value)}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input type="text" value={form.pincode} onChange={(e) => update('pincode', e.target.value)}
                    className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Radius (km)</label>
                  <input type="number" value={form.deliveryRadiusKm} onChange={(e) => update('deliveryRadiusKm', Number(e.target.value))}
                    className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₹)</label>
                  <input type="number" value={form.deliveryFee} onChange={(e) => update('deliveryFee', Number(e.target.value))}
                    className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value (₹)</label>
                <input type="number" value={form.minOrderValue} onChange={(e) => update('minOrderValue', Number(e.target.value))}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" /> Operating Hours
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Store Open</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={form.isOpen}
                    onChange={(e) => update('isOpen', e.target.checked)} />
                  <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${form.isOpen ? 'bg-orange-500' : 'bg-gray-300'}`} />
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Opening Time</label>
                <input type="time" value={form.openingTime} onChange={(e) => update('openingTime', e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Closing Time</label>
                <input type="time" value={form.closingTime} onChange={(e) => update('closingTime', e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-400" /> Payout Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                <input type="text" value={form.bankAccountNumber} onChange={(e) => update('bankAccountNumber', e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <input type="text" value={form.ifscCode} onChange={(e) => update('ifscCode', e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                <input type="text" value={form.upiId} onChange={(e) => update('upiId', e.target.value)}
                  className="w-full h-11 px-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" placeholder="vendor@upi" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100">
          <Save className="h-5 w-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
