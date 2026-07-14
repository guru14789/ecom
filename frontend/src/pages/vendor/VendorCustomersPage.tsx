import React, { useEffect, useState } from 'react';
import { vendorApi } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { Users, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export const VendorCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await vendorApi.crm.customers();
      setCustomers(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-blue-950 tracking-tight">Customers (CRM)</h2>
          <p className="text-sm text-gray-500 mt-1">Manage relationships with buyers who have purchased your products.</p>
        </div>
        <div className="bg-orange-500/10 text-orange-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          {customers.length} Total Customers
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Total Orders</th>
                <th className="px-6 py-4">Lifetime Spent (₹)</th>
                <th className="px-6 py-4">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                      <Mail className="w-3.5 h-3.5" /> {c.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                      <Phone className="w-3.5 h-3.5" /> {c.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-medium text-gray-900">
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                      {c.totalOrders}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-green-600">₹{c.totalSpent.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(c.lastOrderDate).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    No customers found yet. Once you start receiving orders, buyers will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
