import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Settings, ExternalLink, Link2, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const VendorIntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState([
    { id: 'shopify', name: 'Shopify Sync', desc: 'Auto-import products and sync inventory from your Shopify store.', logo: '🛍️', active: false },
    { id: 'woocommerce', name: 'WooCommerce Connector', desc: 'Sync inventory counts and prices automatically with WooCommerce.', logo: '🔌', active: false },
    { id: 'shiprocket', name: 'Shiprocket Fulfillment', desc: 'Automate AWB booking and dispatch logistics through Shiprocket.', logo: '🚀', active: true },
    { id: 'stripe', name: 'Stripe Payouts', desc: 'Process instant settlements and view transactional fees logs.', logo: '💳', active: true }
  ]);

  const [configuringId, setConfiguringId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  const handleToggle = (id: string, currentStatus: boolean) => {
    if (!currentStatus) {
      // Prompt configuration before activation
      setConfiguringId(id);
      setApiKey('');
    } else {
      setIntegrations(prev => prev.map(item => item.id === id ? { ...item, active: false } : item));
      toast.success('Integration deactivated');
    }
  };

  const handleSaveConfig = () => {
    if (!apiKey.trim()) {
      toast.error('API Key/Credentials are required');
      return;
    }
    setIntegrations(prev => prev.map(item => item.id === configuringId ? { ...item, active: true } : item));
    setConfiguringId(null);
    toast.success('Sync integration successfully configured!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">App Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">Connect your catalog and billing with Shopify, WooCommerce, and Shiprocket.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-3xl">{item.logo}</span>
                <button
                  onClick={() => handleToggle(item.id, item.active)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {item.active ? (
                    <ToggleRight className="w-12 h-8 text-orange-500" />
                  ) : (
                    <ToggleLeft className="w-12 h-8 text-gray-300" />
                  )}
                </button>
              </div>
              <div>
                <h3 className="text-base font-black text-blue-950 flex items-center gap-1.5">
                  {item.name}
                  {item.active && (
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed font-medium">{item.desc}</p>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-between items-center text-xs">
              <span className={`font-bold ${item.active ? 'text-green-600' : 'text-gray-400'}`}>
                {item.active ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
              {item.active && (
                <button
                  onClick={() => {
                    setConfiguringId(item.id);
                    setApiKey('••••••••••••••••');
                  }}
                  className="flex items-center gap-1 text-gray-600 font-bold hover:underline"
                >
                  <Settings className="w-3.5 h-3.5" /> Configure
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {configuringId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-6 border">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-blue-950">
                  Configure {integrations.find(i => i.id === configuringId)?.name}
                </h2>
                <p className="text-xs text-gray-500 mt-1">Enter your API Credentials to authorize synchronization.</p>
              </div>
              <button onClick={() => setConfiguringId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">API Key / Access Token</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium transition-all"
                  placeholder="Paste credentials token"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setConfiguringId(null)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Save Sync
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
