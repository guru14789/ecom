import React from 'react';
import { Store, MapPin, Clock, DollarSign, Save } from 'lucide-react';

export const VendorSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your storefront details, delivery zones, and payout info.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-gray-400" />
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input type="text" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" defaultValue="FreshMart Super Store 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                <textarea className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" rows={3} defaultValue="Your neighborhood grocery store for daily fresh produce and essentials." />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              Location & Delivery
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address</label>
                <textarea className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" rows={2} defaultValue="123 Market Road, Sector 4, Bangalore" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input type="text" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" defaultValue="560102" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Radius (km)</label>
                  <input type="number" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" defaultValue="5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" />
              Operating Hours
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Open Status</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Opening Time</label>
                <input type="time" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" defaultValue="06:00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Closing Time</label>
                <input type="time" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" defaultValue="23:00" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-400" />
              Payout Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                <input type="password" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" defaultValue="XXXXXXXX1234" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <input type="text" className="w-full h-10 px-3 rounded-lg border focus:ring-2 focus:ring-primary focus:outline-none" defaultValue="HDFC0001234" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors">
          <Save className="h-5 w-5" />
          Save Changes
        </button>
      </div>
    </div>
  );
};
