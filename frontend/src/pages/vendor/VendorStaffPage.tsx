import React, { useState, useEffect } from 'react';
import { vendorApi } from '../../lib/api';
import { Shield, Plus, Trash2, Mail, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const VendorStaffPage: React.FC = () => {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff'>('staff');
  const [inviting, setInviting] = useState(false);

  const fetchVendor = async () => {
    try {
      const res = await vendorApi.settings.get();
      if (res.success) setVendor(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendor();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      await vendorApi.settings.update({
        inviteStaff: { email: inviteEmail, role: inviteRole }
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      fetchVendor();
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite staff');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await vendorApi.settings.update({
        removeStaff: userId
      });
      toast.success('Staff member removed');
      fetchVendor();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove staff');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const staffList = vendor?.staff || [];
  const myUserId = vendor?.userId; // Owner

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Staff & Roles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage who has access to your vendor dashboard</p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" /> Add Staff
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Owner */}
              <tr className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{vendor?.businessName || 'Vendor'} (Owner)</p>
                      <p className="text-gray-500 text-xs">{vendor?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-orange-500/10 text-orange-500 font-bold text-xs rounded-full">Owner</span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-1.5 text-green-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-600" /> Active
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-400 italic text-xs">Cannot be removed</span>
                </td>
              </tr>
              {/* Staff members */}
              {staffList.map((member: any) => (
                <tr key={member.userId} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{member.name || 'Invited User'}</p>
                        <p className="text-gray-500 text-xs">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 capitalize">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold text-xs rounded-full">{member.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-green-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-green-600" /> Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRemove(member.userId)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Remove User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {staffList.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No extra staff members added yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Invite Staff</h2>
              <p className="text-sm text-gray-500 mt-1">They must already have an account on Shopsyy.</p>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                    placeholder="staff@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`border rounded-xl p-3 cursor-pointer transition-colors ${inviteRole === 'staff' ? 'border-orange-500 bg-orange-500/5' : 'hover:bg-gray-50'}`}>
                    <input type="radio" name="role" value="staff" checked={inviteRole === 'staff'} onChange={() => setInviteRole('staff')} className="sr-only" />
                    <span className="font-bold text-sm block mb-1 text-gray-900">Staff</span>
                    <span className="text-xs text-gray-500">Can manage products and orders.</span>
                  </label>
                  <label className={`border rounded-xl p-3 cursor-pointer transition-colors ${inviteRole === 'admin' ? 'border-orange-500 bg-orange-500/5' : 'hover:bg-gray-50'}`}>
                    <input type="radio" name="role" value="admin" checked={inviteRole === 'admin'} onChange={() => setInviteRole('admin')} className="sr-only" />
                    <span className="font-bold text-sm block mb-1 text-gray-900">Admin</span>
                    <span className="text-xs text-gray-500">Full access to everything.</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
