import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Map, Box, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { vendorApi } from '../../lib/api';

const DEFAULT_COURIERS = [
  { id: 'delhivery', name: 'Delhivery Logistics', enabled: true, logo: '🚚' },
  { id: 'bluedart', name: 'BlueDart Express', enabled: true, logo: '✈️' },
  { id: 'ekart', name: 'EKART Logistics', enabled: false, logo: '📦' },
  { id: 'shiprocket', name: 'Shiprocket Multi-carrier', enabled: false, logo: '🚀' },
];

export const VendorShippingPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [couriers, setCouriers] = useState(DEFAULT_COURIERS);
  const [deliveryMode, setDeliveryMode] = useState<'automatic' | 'manual'>('automatic');
  const [shippingFeeType, setShippingFeeType] = useState<'flat' | 'free_above' | 'weight_based'>('flat');
  const [flatRate, setFlatRate] = useState(40);
  const [freeAboveLimit, setFreeAboveLimit] = useState(500);

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-shipping-config'],
    queryFn: async () => {
      const res = await vendorApi.shippingConfig.get();
      return res.data;
    },
    staleTime: 5 * 60_000,
  });

  // Populate form with server data when it loads
  useEffect(() => {
    if (data) {
      if (data.couriers?.length) {
        // Merge server state with local courier list (maintain logo)
        setCouriers(DEFAULT_COURIERS.map(dc => {
          const found = data.couriers.find((c: any) => c.id === dc.id);
          return found ? { ...dc, enabled: found.enabled } : dc;
        }));
      }
      if (data.deliveryMode) setDeliveryMode(data.deliveryMode);
      if (data.shippingFeeType) setShippingFeeType(data.shippingFeeType);
      if (data.flatRate !== undefined) setFlatRate(data.flatRate);
      if (data.freeAboveLimit !== undefined) setFreeAboveLimit(data.freeAboveLimit);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      vendorApi.shippingConfig.save({
        couriers: couriers.map(({ id, name, enabled }) => ({ id, name, enabled })),
        deliveryMode,
        shippingFeeType,
        flatRate,
        freeAboveLimit,
      }),
    onSuccess: () => {
      toast.success('Shipping settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-shipping-config'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save shipping settings'),
  });

  const toggleCourier = (id: string) => {
    setCouriers(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Shipping & Deliveries</h1>
          <p className="text-sm text-gray-500 mt-1">Configure courier services, delivery rates, and pickup schedules.</p>
        </div>
        {isLoading && <RefreshCw className="w-5 h-5 text-gray-400 animate-spin relative z-10" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Rates configuration */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <Map className="w-5 h-5 text-orange-500" /> Rates & Rules
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Shipping Charge Model</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['flat', 'free_above', 'weight_based'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setShippingFeeType(mode)}
                      className={`border p-3.5 rounded-xl text-center font-bold text-sm transition-all ${
                        shippingFeeType === mode ? 'border-orange-500 bg-orange-50/30 text-orange-600' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {mode === 'flat' ? 'Flat Rate' : mode === 'free_above' ? 'Free Above Min' : 'Weight Based'}
                    </button>
                  ))}
                </div>
              </div>

              {shippingFeeType === 'flat' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Standard Flat Fee (₹)</label>
                  <input
                    type="number"
                    value={flatRate}
                    onChange={(e) => setFlatRate(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full max-w-xs px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold transition-all"
                  />
                </div>
              )}

              {shippingFeeType === 'free_above' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Standard Fee (₹)</label>
                    <input
                      type="number"
                      value={flatRate}
                      onChange={(e) => setFlatRate(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Free Delivery Above (₹)</label>
                    <input
                      type="number"
                      value={freeAboveLimit}
                      onChange={(e) => setFreeAboveLimit(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold transition-all"
                    />
                  </div>
                </div>
              )}

              {shippingFeeType === 'weight_based' && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <p className="text-sm text-orange-700 font-medium">Weight-based shipping rates are configured per product. Set product weight in your product settings.</p>
                </div>
              )}
            </div>
          </div>

          {/* Courier partners */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <Truck className="w-5 h-5 text-orange-500" /> Carrier Integrations
            </h2>
            <div className="divide-y divide-gray-100">
              {couriers.map((courier) => (
                <div key={courier.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{courier.logo}</span>
                    <span className="font-bold text-gray-800">{courier.name}</span>
                  </div>
                  <button
                    onClick={() => toggleCourier(courier.id)}
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      courier.enabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {courier.enabled ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Pickup dispatch mode */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border space-y-4">
            <h2 className="text-md font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
              <Box className="w-4 h-4 text-orange-500" /> Dispatch Mode
            </h2>
            <div className="space-y-3">
              {(['automatic', 'manual'] as const).map((mode) => (
                <label key={mode} className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="dispatch"
                    checked={deliveryMode === mode}
                    onChange={() => setDeliveryMode(mode)}
                    className="mt-1 accent-orange-500"
                  />
                  <div>
                    <span className="font-bold text-sm block text-gray-900">
                      {mode === 'automatic' ? 'Auto Pickup' : 'Manual Dispatch'}
                    </span>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      {mode === 'automatic'
                        ? 'Pickup automatically requested upon packing.'
                        : 'Select and book courier dispatch manually.'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Current config summary */}
          <div className="bg-orange-50 p-5 rounded-[2rem] border border-orange-200 space-y-2">
            <h3 className="text-sm font-bold text-orange-800">Current Config</h3>
            <div className="text-xs text-orange-700 space-y-1">
              <p>Mode: <span className="font-bold capitalize">{shippingFeeType.replace('_', ' ')}</span></p>
              <p>Base Rate: <span className="font-bold">₹{flatRate}</span></p>
              {shippingFeeType === 'free_above' && (
                <p>Free Above: <span className="font-bold">₹{freeAboveLimit}</span></p>
              )}
              <p>Active Carriers: <span className="font-bold">{couriers.filter(c => c.enabled).length}</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {saveMutation.isPending ? 'Saving...' : 'Save Shipping Config'}
        </button>
      </div>
    </div>
  );
};
