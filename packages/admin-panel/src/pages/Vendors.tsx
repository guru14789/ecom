import React, { useEffect, useState } from 'react';
import {
  Search, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  ChevronDown, ChevronRight, Download, ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Vendor {
  id: string;
  vendor_id: string;
  business_name: string;
  tier: string;
  status: 'pending' | 'active' | 'suspended';
  commissionRate?: number;
  created_at: string;
  kycDocs?: { name: string; url: string }[];
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-[#FF7A0F]/10 text-[#FF7A0F] border border-[#FF7A0F]/20',
  active: 'bg-[#01B4BA]/10 text-[#01B4BA] border border-[#01B4BA]/20',
  suspended: 'bg-slate-100 text-slate-500 border border-slate-200',
};

const STATUS_FILTERS = ['all', 'pending', 'active', 'suspended'];

const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionValue, setCommissionValue] = useState<number>(0);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await api.get(`/admin/vendors?${params}`);
      setVendors(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, [page, statusFilter]);

  useEffect(() => { setPage(1); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/admin/vendors/${id}/status`, { status });
      toast.success(`Vendor ${status}`);
      fetchVendors();
    } catch {
      toast.error('Failed to update vendor status');
    }
  };

  const saveCommission = async (vendorId: string) => {
    try {
      await api.put(`/admin/vendors/${vendorId}/commission`, { commissionRate: commissionValue });
      toast.success('Commission rate updated');
      setEditingCommission(null);
      fetchVendors();
    } catch {
      toast.error('Failed to update commission');
    }
  };

  const exportCSV = () => {
    const csv = [
      'Vendor ID,Business Name,Tier,Status,Joined',
      ...vendors.map((v) => `${v.vendor_id},"${v.business_name}",${v.tier},${v.status},${new Date(v.created_at).toLocaleDateString('en-IN')}`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const filtered = vendors.filter((v) =>
    v.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.vendor_id?.includes(search)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded-[6px]" />
        <div className="h-12 skeleton rounded-[6px]" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-2xl skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_150ms_ease]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-[#01406D]">Vendor Management</h1>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-1.5 border border-[#01406D] text-[#01406D] px-4 py-2.5 rounded-[6px] text-xs font-inter font-bold min-h-[44px] hover:bg-[#F5FEFE] transition-colors duration-150">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={fetchVendors} className="flex items-center gap-1.5 text-[#01B4BA] px-4 py-2.5 rounded-[6px] text-xs font-inter font-bold min-h-[44px] hover:bg-[#01B4BA]/5 transition-colors duration-150">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8FA3]" size={15} />
          <input
            type="text" placeholder="Search by name or ID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-white border border-[#E0EFEF] rounded-[6px] text-sm font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30 focus:border-[#01B4BA] transition-all duration-150"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-[6px] text-xs font-inter font-bold min-h-[36px] transition-all duration-150 ${
                statusFilter === s ? 'bg-[#01B4BA] text-white' : 'bg-white border border-[#E0EFEF] text-[#6B8FA3] hover:border-[#01B4BA]/40'
              }`}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5FEFE] border-b border-[#E0EFEF]">
                <th className="w-8 px-3 py-3" />
                <th className="text-left px-4 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Commission</th>
                <th className="text-left px-4 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#F5FEFE] flex items-center justify-center">
                        <AlertTriangle size={28} className="text-[#01B4BA]" />
                      </div>
                      <div>
                        <h3 className="font-artz font-bold text-lg text-[#01406D]">No vendors found</h3>
                        <p className="font-inter text-sm text-[#6B8FA3] mt-0.5">Try adjusting your search or filters</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((vendor, idx) => (
                  <React.Fragment key={vendor.id}>
                    <tr className={`border-b border-[#E0EFEF] hover:bg-[#F5FEFE]/50 transition-colors duration-150 ${idx % 2 === 1 ? 'bg-[#F5FEFE]/30' : ''}`}>
                      <td className="px-3 py-4">
                        <button onClick={() => setExpandedId(expandedId === vendor.id ? null : vendor.id)} className="p-1 hover:bg-[#E0EFEF] rounded-[4px] transition-colors">
                          {expandedId === vendor.id ? <ChevronDown size={14} className="text-[#6B8FA3]" /> : <ChevronRight size={14} className="text-[#6B8FA3]" />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-inter text-sm font-medium text-[#01406D]">{vendor.business_name || 'Unnamed Store'}</p>
                        <p className="font-inter text-xs text-[#6B8FA3] mt-0.5">ID: {vendor.vendor_id}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-inter font-bold px-2.5 py-1 rounded-full bg-[#01406D]/10 text-[#01406D]">
                          {vendor.tier}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-inter text-xs">
                        {editingCommission === vendor.id ? (
                          <div className="flex items-center gap-1.5">
                            <input type="number" value={commissionValue} onChange={(e) => setCommissionValue(+e.target.value)}
                              className="w-16 px-2 py-1 border border-[#01406D] rounded-[4px] text-xs outline-none focus:ring-2 focus:ring-[#01B4BA]/30" min={0} max={100} step={0.5} />
                            <button onClick={() => saveCommission(vendor.id)} className="text-[#01B4BA] font-bold hover:underline text-[10px]">Save</button>
                            <button onClick={() => setEditingCommission(null)} className="text-[#6B8FA3] hover:underline text-[10px]">X</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingCommission(vendor.id); setCommissionValue(vendor.commissionRate || 10); }}
                            className="text-[#01406D] hover:text-[#01B4BA] transition-colors">
                            {vendor.commissionRate ?? 10}%
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-inter font-bold ${STATUS_STYLES[vendor.status] || 'bg-slate-100 text-slate-500'}`}>
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-inter text-xs text-[#6B8FA3]">
                        {new Date(vendor.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => updateStatus(vendor.vendor_id, 'active')} disabled={vendor.status === 'active'}
                            className="p-2 rounded-[6px] hover:bg-emerald-50 text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed min-h-[36px] transition-colors duration-150" title="Approve">
                            <CheckCircle2 size={15} />
                          </button>
                          <button onClick={() => updateStatus(vendor.vendor_id, 'suspended')} disabled={vendor.status === 'suspended'}
                            className="p-2 rounded-[6px] hover:bg-amber-50 text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed min-h-[36px] transition-colors duration-150" title="Suspend">
                            <AlertTriangle size={15} />
                          </button>
                          <button onClick={() => updateStatus(vendor.vendor_id, 'pending')} disabled={vendor.status === 'pending'}
                            className="p-2 rounded-[6px] hover:bg-red-50 text-red-600 disabled:opacity-30 disabled:cursor-not-allowed min-h-[36px] transition-colors duration-150" title="Reject / Set Pending">
                            <XCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === vendor.id && (
                      <tr key={`${vendor.id}-expanded`} className="bg-[#F5FEFE]/50">
                        <td colSpan={7} className="px-12 py-4">
                          <div className="flex items-center gap-6">
                            <span className="text-xs font-inter font-bold text-[#01406D] uppercase">KYC Documents</span>
                            {(vendor.kycDocs || []).length > 0 ? (
                              vendor.kycDocs!.map((doc, i) => (
                                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs font-inter text-[#01B4BA] hover:underline flex items-center gap-1">
                                  <Download size={12} /> {doc.name}
                                </a>
                              ))
                            ) : (
                              <span className="text-xs font-inter text-[#6B8FA3]">No documents uploaded</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#E0EFEF]">
            <span className="text-xs font-inter text-[#6B8FA3]">Page {page} of {totalPages}</span>
            <div className="flex gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-[6px] hover:bg-[#F5FEFE] disabled:opacity-30 min-h-[32px] transition-colors">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-[6px] text-xs font-inter font-bold transition-colors duration-150 ${
                    page === p ? 'bg-[#01B4BA] text-white' : 'bg-[#F5FEFE] text-[#6B8FA3] hover:bg-[#E0EFEF]'
                  }`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-[6px] hover:bg-[#F5FEFE] disabled:opacity-30 min-h-[32px] transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vendors;
