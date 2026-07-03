import React from 'react';
import { Shield, CreditCard, Percent, Save, Globe } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Super-admin settings for commissions, payments, and global rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="space-y-6">
          {/* Commission Config */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Percent className="h-5 w-5 text-gray-400" />
              Commission & Fees
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Take Rate (%)</label>
                <input type="number" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" defaultValue="15" />
                <p className="text-xs text-gray-500 mt-1">Percentage deducted from vendor payouts.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Delivery Fee (₹)</label>
                  <input type="number" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" defaultValue="25" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Free Delivery Threshold (₹)</label>
                  <input type="number" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" defaultValue="200" />
                </div>
              </div>
            </div>
          </div>

          {/* Global Operations */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-400" />
              Global Operations
            </h2>
            <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
              <div>
                <h4 className="font-bold text-gray-900">Maintenance Mode</h4>
                <p className="text-xs text-gray-500">Temporarily disable app for buyers.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Payment Gateway */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" />
              Razorpay Integration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Key ID</label>
                <input type="password" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm" defaultValue="rzp_test_1234567890" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razorpay Key Secret</label>
                <input type="password" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm" defaultValue="********************" />
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded-xl font-medium border border-yellow-200">
                Warning: Updating these keys will immediately affect live transactions across the entire platform.
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" />
              Admin Security
            </h2>
            <button className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm">
              Rotate JWT Secret Keys
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors">
          <Save className="h-5 w-5" />
          Save Global Config
        </button>
      </div>
    </div>
  );
};
