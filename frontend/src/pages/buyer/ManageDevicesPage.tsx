import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';

export const ManageDevicesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4 md:px-8 max-w-4xl mx-auto selection:bg-orange-100">
      <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
        Manage Devices
      </h1>
      <p className="text-xl text-gray-400 font-light mb-16">
        View and manage the devices currently signed into your shopyng account.
      </p>
      
      <div className="space-y-6">
        {/* Current Device */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-gray-50/50 border border-green-100 rounded-3xl">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-500 shrink-0">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">MacBook Pro (Current)</h3>
              <p className="text-sm text-gray-500 font-light">Last active: Just now • Chrome on macOS</p>
            </div>
          </div>
        </div>

        {/* Other Devices */}
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-white border border-gray-100 rounded-3xl">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">iPhone 13</h3>
              <p className="text-sm text-gray-500 font-light">Last active: 2 days ago • Safari on iOS</p>
            </div>
          </div>
          <button className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors ml-20 md:ml-0">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
