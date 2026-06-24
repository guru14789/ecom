import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, ExternalLink, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface VendorKyc {
  businessType?: string;
  pan?: string;
  kycStatus: string;
  kycRejectedReason?: string;
  documents: { type: string; url: string; verified: boolean }[];
}

interface VendorBank {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  accountType: string;
  bankName?: string;
}

interface Vendor {
  _id: string;
  name: string;
  storeName: string;
  email: string;
  phoneNumber: string;
  gstin?: string;
  pan?: string;
  businessType?: string;
  kyc: VendorKyc;
  bank: VendorBank;
  kycVerified: boolean;
  verified: boolean;
  createdAt: string;
}

const VendorOnboarding: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/vendors/kyc-pending');
      setVendors(res.data.data || []);
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleApprove = async (vendorId: string) => {
    if (!window.confirm('Approve this vendor\'s KYC?')) return;
    setActionLoading(vendorId);
    try {
      await api.put(`/admin/vendors/${vendorId}/kyc`, { kycStatus: 'verified' });
      toast.success('Vendor KYC approved');
      setVendors(vendors.filter((v) => v._id !== vendorId));
      if (selectedVendor?._id === vendorId) setSelectedVendor(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const openReject = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedVendor || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setActionLoading(selectedVendor._id);
    try {
      await api.put(`/admin/vendors/${selectedVendor._id}/kyc`, { kycStatus: 'rejected', kycRejectedReason: rejectReason });
      toast.success('Vendor KYC rejected');
      setVendors(vendors.filter((v) => v._id !== selectedVendor._id));
      setShowRejectModal(false);
      setSelectedVendor(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = vendors.filter((v) =>
    v.storeName?.toLowerCase().includes(search.toLowerCase()) ||
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-artz font-bold text-navy">Vendor Onboarding</h1>
          <p className="text-sm text-slate-500 mt-1">Review and verify vendor KYC submissions</p>
        </div>
        <button onClick={fetchVendors} className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors">
          <Shield size={16} /> Refresh
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Vendor List */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No pending KYC submissions</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filtered.map((v) => (
                  <div key={v._id} className={`p-4 hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedVendor?._id === v._id ? 'bg-teal/5 border-l-2 border-teal' : ''}`} onClick={() => setSelectedVendor(v)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{v.storeName || v.name}</p>
                        <p className="text-xs text-slate-500">{v.email} • {v.phoneNumber}</p>
                      </div>
                      <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded-full uppercase">Pending Review</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vendor Detail Panel */}
        <div className="xl:col-span-1">
          {selectedVendor ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm sticky top-20">
              <h3 className="font-artz font-bold text-navy mb-4">Vendor Details</h3>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Store</p>
                  <p className="text-slate-800 font-medium">{selectedVendor.storeName || selectedVendor.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Contact</p>
                  <p className="text-slate-800">{selectedVendor.email}</p>
                  <p className="text-slate-800">{selectedVendor.phoneNumber}</p>
                </div>
                {selectedVendor.gstin && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">GSTIN</p>
                    <p className="text-slate-800 font-mono text-xs">{selectedVendor.gstin}</p>
                  </div>
                )}
                {selectedVendor.kyc.pan && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">PAN</p>
                    <p className="text-slate-800 font-mono text-xs">{selectedVendor.kyc.pan}</p>
                  </div>
                )}
                {selectedVendor.kyc.businessType && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Business Type</p>
                    <p className="text-slate-800 capitalize">{selectedVendor.kyc.businessType}</p>
                  </div>
                )}

                {/* Bank Details */}
                {selectedVendor.bank?.accountHolderName && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Bank Details</p>
                    <p className="text-slate-800">{selectedVendor.bank.accountHolderName}</p>
                    <p className="text-xs text-slate-600 font-mono">{selectedVendor.bank.accountNumber}</p>
                    <p className="text-xs text-slate-600 font-mono">IFSC: {selectedVendor.bank.ifsc}</p>
                    <p className="text-xs text-slate-600">{selectedVendor.bank.bankName}</p>
                  </div>
                )}

                {/* Documents */}
                {selectedVendor.kyc.documents?.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Documents</p>
                    {selectedVendor.kyc.documents.map((doc, i) => (
                      <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-teal hover:underline mb-1">
                        <ExternalLink size={12} /> {doc.type.replace('_', ' ')}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-6">
                <button onClick={() => handleApprove(selectedVendor._id)} disabled={actionLoading === selectedVendor._id} className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50">
                  {actionLoading === selectedVendor._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Approve
                </button>
                <button onClick={() => openReject(selectedVendor)} disabled={actionLoading === selectedVendor._id} className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
              <Shield size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a vendor to review their KYC details</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-amber-500" />
              <h3 className="font-artz font-bold text-navy">Reject KYC</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">Provide a reason for rejecting {selectedVendor?.storeName || selectedVendor?.name}'s KYC submission.</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20" placeholder="e.g. Invalid PAN document, address proof not clear..." />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowRejectModal(false)} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading === selectedVendor?._id} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
                {actionLoading === selectedVendor?._id ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOnboarding;
