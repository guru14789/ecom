import React, { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAppDispatch } from '../store';

const SUBSCRIPTION_TIERS = [
  { id: 'basic', name: 'Basic', price: 0, productLimit: 10, features: ['Product listings', 'Basic analytics', 'Email support'], popular: false },
  { id: 'pro', name: 'Pro', price: 999, productLimit: 100, features: ['All Basic features', 'Advanced analytics', 'Priority support', 'Bulk upload', 'Custom storefront'], popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 4999, productLimit: 1000, features: ['All Pro features', 'API access', 'Dedicated manager', 'White-label options', 'Priority payouts'], popular: false },
];

const Subscription: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selectedTier, setSelectedTier] = useState('basic');
  const [currentTier, setCurrentTier] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    api.get('/vendor/subscription')
      .then((res) => {
        const sub = res.data.data?.subscription;
        if (sub?.tier) {
          setCurrentTier(sub.tier);
          setSelectedTier(sub.tier);
        }
        if (res.data.data?.tiers) {
          dispatch({ type: 'SET_SUBSCRIPTION', payload: sub });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handleUpgrade = async () => {
    if (selectedTier === currentTier) {
      toast('This is your current plan');
      return;
    }
    setUpgrading(true);
    try {
      await api.post('/vendor/subscription', { tier: selectedTier });
      setCurrentTier(selectedTier);
      toast.success(`Upgraded to ${SUBSCRIPTION_TIERS.find(t => t.id === selectedTier)?.name} plan!`);
      dispatch({ type: 'SET_SUBSCRIPTION', payload: { tier: selectedTier, status: 'active', productLimit: SUBSCRIPTION_TIERS.find(t => t.id === selectedTier)?.productLimit } });
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-artz font-bold text-navy mb-2">Subscription</h1>
      <p className="text-sm text-slate-500 mb-6">Choose a plan that fits your business. No commission — keep 100% of your earnings.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {SUBSCRIPTION_TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`relative bg-white rounded-2xl border-2 p-6 cursor-pointer transition-all ${
              selectedTier === tier.id ? 'border-teal shadow-lg shadow-teal/10' : 'border-slate-100 hover:border-slate-200'
            }`}
            onClick={() => setSelectedTier(tier.id)}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal text-white px-4 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </span>
            )}
            <div className="text-center mb-6 mt-2">
              <h3 className="text-lg font-bold text-navy font-artz">{tier.name}</h3>
              <p className="text-3xl font-bold text-slate-800 mt-2">₹{tier.price}<span className="text-sm font-normal text-slate-400">/mo</span></p>
            </div>
            <ul className="space-y-3 mb-6">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="text-teal mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${
                selectedTier === tier.id ? 'bg-navy text-white hover:bg-primary-hover' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {upgrading && selectedTier === tier.id ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Upgrading...</span>
              ) : tier.id === currentTier ? (
                'Current Plan'
              ) : tier.price === 0 ? (
                'Downgrade'
              ) : (
                'Choose Plan'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;