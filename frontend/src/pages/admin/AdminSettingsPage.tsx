import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Shield, CreditCard, Percent, Save, Globe, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PlatformConfig {
  commissionRate: number;
  baseDeliveryFee: number;
  freeDeliveryThreshold: number;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  maintenanceMode: boolean;
  maxDeliveryRadius: number;
  defaultAvgDeliveryMins: number;
  minVendorPayout: number;
  supportEmail: string;
  supportPhone: string;
}

const DEFAULT_CONFIG: PlatformConfig = {
  commissionRate: 15,
  baseDeliveryFee: 25,
  freeDeliveryThreshold: 200,
  razorpayKeyId: '',
  razorpayKeySecret: '',
  maintenanceMode: false,
  maxDeliveryRadius: 10,
  defaultAvgDeliveryMins: 10,
  minVendorPayout: 100,
  supportEmail: 'support@shopsyy.com',
  supportPhone: '+91 1800-123-4567',
};

export const AdminSettingsPage: React.FC = () => {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'platform'));
        if (snap.exists()) {
          setConfig({ ...DEFAULT_CONFIG, ...snap.data() });
        }
      } catch (err) {
        console.error('Error fetching config:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await setDoc(doc(db, 'config', 'platform'), {
        ...config,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Platform configuration saved!');
    } catch (err) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof PlatformConfig, value: any) => setConfig(prev => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Super-admin settings for commissions, payments, and global rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Percent className="h-5 w-5 text-gray-400" /> Commission & Fees
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Take Rate (%)</label>
                <input type="number" value={config.commissionRate}
                  onChange={(e) => update('commissionRate', Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" />
                <p className="text-xs text-gray-500 mt-1">Percentage deducted from vendor payouts.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Delivery Fee (₹)</label>
                  <input type="number" value={config.baseDeliveryFee}
                    onChange={(e) => update('baseDeliveryFee', Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Free Delivery Threshold (₹)</label>
                  <input type="number" value={config.freeDeliveryThreshold}
                    onChange={(e) => update('freeDeliveryThreshold', Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Delivery Radius (km)</label>
                  <input type="number" value={config.maxDeliveryRadius}
                    onChange={(e) => update('maxDeliveryRadius', Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Delivery Time (mins)</label>
                  <input type="number" value={config.defaultAvgDeliveryMins}
                    onChange={(e) => update('defaultAvgDeliveryMins', Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Vendor Payout (₹)</label>
                <input type="number" value={config.minVendorPayout}
                  onChange={(e) => update('minVendorPayout', Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-400" /> Global Operations
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
                <div>
                  <h4 className="font-bold text-gray-900">Maintenance Mode</h4>
                  <p className="text-xs text-gray-500">Temporarily disable app for buyers.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={config.maintenanceMode}
                    onChange={(e) => update('maintenanceMode', e.target.checked)} />
                  <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${config.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                  <input type="email" value={config.supportEmail}
                    onChange={(e) => update('supportEmail', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                  <input type="text" value={config.supportPhone}
                    onChange={(e) => update('supportPhone', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" /> Razorpay Integration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Key ID</label>
                <input type="password" value={config.razorpayKeyId}
                  onChange={(e) => update('razorpayKeyId', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Key Secret</label>
                <input type="password" value={config.razorpayKeySecret}
                  onChange={(e) => update('razorpayKeySecret', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm" />
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded-xl font-medium border border-yellow-200">
                Warning: Updating these keys will immediately affect live transactions across the entire platform.
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" /> Admin Security
            </h2>
            <div className="space-y-4">
              <button className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm">
                Rotate JWT Secret Keys
              </button>
              <button className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm">
                Regenerate API Keys
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors disabled:opacity-70">
          <Save className="h-5 w-5" />
          {saving ? 'Saving...' : 'Save Global Config'}
        </button>
      </div>
    </div>
  );
};
