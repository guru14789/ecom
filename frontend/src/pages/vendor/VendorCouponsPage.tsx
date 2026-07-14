import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { Tag, Plus, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit: number;
  usedCount: number;
  validTill: string;
  isActive: boolean;
  vendorId: string;
}

export const VendorCouponsPage: React.FC = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '', type: 'percentage' as 'percentage' | 'fixed',
    discountValue: '', maxDiscount: '', minOrderValue: '',
    usageLimit: '', validTill: '', isActive: true,
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'coupons'), where('vendorId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const cps: Coupon[] = [];
      snapshot.forEach((doc) => cps.push({ id: doc.id, ...doc.data() } as Coupon));
      setCoupons(cps);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const resetForm = () => {
    setFormData({ code: '', type: 'percentage', discountValue: '', maxDiscount: '', minOrderValue: '', usageLimit: '', validTill: '', isActive: true });
    setEditingCoupon(null);
  };

  const handleSave = async () => {
    if (!user || !formData.code || !formData.discountValue || !formData.usageLimit || !formData.validTill) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const data = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        discountValue: Number(formData.discountValue),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : 0,
        usageLimit: Number(formData.usageLimit),
        usedCount: editingCoupon ? editingCoupon.usedCount : 0,
        validTill: formData.validTill,
        isActive: formData.isActive,
        vendorId: user.uid,
        updatedAt: new Date().toISOString(),
      };

      if (editingCoupon) {
        await updateDoc(doc(db, 'coupons', editingCoupon.id), data);
        toast.success('Coupon updated!');
      } else {
        await addDoc(collection(db, 'coupons'), { ...data, createdAt: new Date().toISOString() });
        toast.success('Coupon created!');
      }
      setShowForm(false);
      resetForm();
    } catch (err) {
      toast.error('Failed to save coupon');
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', couponId));
      toast.success('Coupon deleted');
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), { isActive: !coupon.isActive });
      toast.success(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error('Failed to update coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Discount Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage promotional codes for your store.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="h-5 w-5" /> Create Coupon
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
                <input type="text" value={formData.code}
                  onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none uppercase"
                  placeholder="WELCOME50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select value={formData.type}
                    onChange={(e) => setFormData(p => ({ ...p, type: e.target.value as any }))}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                  <input type="number" value={formData.discountValue}
                    onChange={(e) => setFormData(p => ({ ...p, discountValue: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                  <input type="number" value={formData.maxDiscount}
                    onChange={(e) => setFormData(p => ({ ...p, maxDiscount: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
                  <input type="number" value={formData.minOrderValue}
                    onChange={(e) => setFormData(p => ({ ...p, minOrderValue: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit *</label>
                  <input type="number" value={formData.usageLimit}
                    onChange={(e) => setFormData(p => ({ ...p, usageLimit: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Till *</label>
                  <input type="date" value={formData.validTill}
                    onChange={(e) => setFormData(p => ({ ...p, validTill: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={formData.isActive}
                  onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-500 rounded" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button onClick={handleSave}
                  className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all">
                  {editingCoupon ? 'Update' : 'Create'}
                </button>
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Discount</th>
                <th className="px-6 py-4 font-semibold">Usage</th>
                <th className="px-6 py-4 font-semibold">Valid Till</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No coupons yet</td></tr>
              ) : (
                coupons.map(coupon => (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag className={`h-4 w-4 ${coupon.isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                        <span className={`font-bold uppercase tracking-wide ${coupon.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                          {coupon.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {coupon.type === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                      {coupon.maxDiscount ? ` (Max ₹${coupon.maxDiscount})` : ''}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{coupon.usedCount || 0} / {coupon.usageLimit || '∞'}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {coupon.validTill ? new Date(coupon.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(coupon)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingCoupon(coupon); setFormData({ code: coupon.code, type: coupon.type, discountValue: coupon.discountValue.toString(), maxDiscount: coupon.maxDiscount?.toString() || '', minOrderValue: coupon.minOrderValue?.toString() || '', usageLimit: coupon.usageLimit.toString(), validTill: coupon.validTill, isActive: coupon.isActive }); setShowForm(true); }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
