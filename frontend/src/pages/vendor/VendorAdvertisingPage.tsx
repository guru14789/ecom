import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, TrendingUp, BarChart3, Target, RefreshCw, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { vendorApi } from '../../lib/api';

export const VendorAdvertisingPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', budget: 100 });
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['vendor-campaigns'],
    queryFn: async () => {
      const res = await vendorApi.campaigns.list();
      return res.data as any[];
    },
    staleTime: 60_000,
  });

  const campaigns = data || [];

  const metrics = {
    spend: campaigns.reduce((acc, c) => acc + (c.spent || 0), 0),
    clicks: campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0),
    conversions: campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0),
  };

  const createMutation = useMutation({
    mutationFn: (data: { name: string; budget: number }) => vendorApi.campaigns.create(data),
    onSuccess: () => {
      toast.success('Campaign launched successfully!');
      queryClient.invalidateQueries({ queryKey: ['vendor-campaigns'] });
      setShowCreateModal(false);
      setNewCampaign({ name: '', budget: 100 });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create campaign'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      vendorApi.campaigns.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-campaigns'] });
      toast.success('Campaign updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update campaign'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorApi.campaigns.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-campaigns'] });
      toast.success('Campaign deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete campaign'),
  });

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name.trim()) return;
    createMutation.mutate(newCampaign);
  };

  const handleToggleStatus = (campaign: any) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    toggleMutation.mutate({ id: campaign.id, status: newStatus });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Sponsored Ads & Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Boost product visibility, run campaigns, and track conversion rates.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all relative z-10"
        >
          <Plus className="w-4 h-4" /> Create Ad Campaign
        </button>
      </div>

      {/* Metrics overview */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-7 h-7 text-orange-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-orange-50">
                <TrendingUp className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Ad Spend</p>
                <h2 className="text-2xl font-black text-blue-950">₹{metrics.spend.toLocaleString('en-IN')}</h2>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50">
                <BarChart3 className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Clicks</p>
                <h2 className="text-2xl font-black text-blue-950">{metrics.clicks.toLocaleString()} Clicks</h2>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-green-50">
                <Target className="w-7 h-7 text-green-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ad Conversions</p>
                <h2 className="text-2xl font-black text-blue-950">{metrics.conversions.toLocaleString()} Orders</h2>
              </div>
            </div>
          </div>

          {/* Campaigns Table */}
          <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-black text-blue-950">All Campaigns</h2>
              <button onClick={() => refetch()} className="text-gray-400 hover:text-gray-600 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {campaigns.length === 0 ? (
              <div className="p-12 text-center">
                <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900">No campaigns yet</h3>
                <p className="text-sm text-gray-500 mt-1">Create your first ad campaign to boost product visibility.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-600 border-b">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Campaign Name</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Daily Budget</th>
                      <th className="px-6 py-4 font-semibold">Total Spent</th>
                      <th className="px-6 py-4 font-semibold">Clicks</th>
                      <th className="px-6 py-4 font-semibold">Conversions</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map((c: any) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{c.name}</td>
                        <td className="px-6 py-4">
                          {c.status === 'active' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">ACTIVE</span>
                          ) : c.status === 'paused' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-yellow-100 text-yellow-700">PAUSED</span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gray-100 text-gray-600">COMPLETED</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">₹{(c.budget || 0).toLocaleString('en-IN')}/day</td>
                        <td className="px-6 py-4 font-bold text-orange-600">₹{(c.spent || 0).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-semibold text-gray-700">{c.clicks || 0}</td>
                        <td className="px-6 py-4 font-bold text-green-600">{c.conversions || 0}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(c)}
                              disabled={c.status === 'completed' || toggleMutation.isPending}
                              title={c.status === 'active' ? 'Pause' : 'Resume'}
                              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all disabled:opacity-40"
                            >
                              {c.status === 'active' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              disabled={deleteMutation.isPending}
                              title="Delete Campaign"
                              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all disabled:opacity-40"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-6 border">
            <div>
              <h2 className="text-xl font-black text-blue-950">Launch Sponsored Ad</h2>
              <p className="text-sm text-gray-500 mt-1">Acquire more store traffic and visibility.</p>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all"
                  placeholder="e.g. Festival Season Push"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Daily Budget (₹)</label>
                <input
                  type="number"
                  required
                  min="10"
                  value={newCampaign.budget}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: Math.max(10, parseInt(e.target.value) || 0) }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Launching...' : 'Launch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
