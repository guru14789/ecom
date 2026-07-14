import React, { useState, useEffect } from 'react';
import { vendorApi } from '../../lib/api';
import { RefreshCcw, CheckCircle, XCircle, Search, Clock, Box } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const VendorReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchReturns = async () => {
    try {
      const res = await vendorApi.returns.list();
      setReturns(res.data);
    } catch (err: any) {
      toast.error('Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await vendorApi.returns.approve(id);
      toast.success('Return approved successfully');
      fetchReturns();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve return');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    setProcessing(id);
    try {
      await vendorApi.returns.reject(id, reason);
      toast.success('Return rejected');
      fetchReturns();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject return');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Return Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Manage buyer returns and refunds</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : returns.length === 0 ? (
          <div className="text-center py-20">
            <RefreshCcw className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-gray-900">No return requests</p>
            <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Order / Buyer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {returns.map((ret: any) => (
                  <tr key={ret.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">Order #{ret.orderId.substring(0, 8)}</div>
                      <div className="text-gray-500 text-xs mt-1">Buyer: {ret.userId.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {ret.items?.map((item: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <Box className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-900">{item.quantity}x Item</span>
                              <div className="text-gray-500 italic">"{item.reason}"</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ret.status === 'pending' && <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">Pending</span>}
                      {ret.status === 'approved' && <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">Approved</span>}
                      {ret.status === 'rejected' && <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">Rejected</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatDate(ret.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ret.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleReject(ret.id)}
                            disabled={processing === ret.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
                            title="Reject Return"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApprove(ret.id)}
                            disabled={processing === ret.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors border border-green-200"
                            title="Approve Return"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
