import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { PackageSearch, Filter, CheckCircle, XCircle, Search, Trash2, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Product } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      // In a real app we'd fetch vendors alongside products or the backend would populate vendorName.
      // Since the backend returns products, we'll fetch them, then fetch vendors to match.
      const [prodRes, vendRes] = await Promise.all([
        adminApi.products.list(),
        adminApi.vendors.list()
      ]);
      return {
        products: prodRes.data as Product[],
        vendors: vendRes.data as any[]
      };
    }
  });

  useEffect(() => {
    if (data) {
      setProducts(data.products);
      const vNames: Record<string, string> = {};
      data.vendors.forEach((v: any) => {
        vNames[v.userId || v.id] = v.storeName || v.id;
      });
      setVendorNames(vNames);
    }
  }, [data]);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await adminApi.products.delete(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    try {
      await adminApi.products.update(product.id, { isAvailable: !product.isAvailable });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p));
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`Product ${product.isAvailable ? 'hidden' : 'shown'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product');
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchVendor = !vendorFilter || p.vendorId === vendorFilter;
    return matchSearch && matchVendor;
  });

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Global Products</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage the master catalogue across all vendors.</p>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search products..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 w-64 transition-all" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-6 py-4 font-bold">Vendor</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Price</th>
                <th className="px-6 py-4 font-bold">Stock</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading products...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No products found</td></tr>
              ) : (
                filtered.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} className="w-full h-full object-cover" />
                          ) : (
                            <PackageSearch className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="max-w-[200px]">
                          <span className="font-bold text-gray-900 block leading-tight">{product.name}</span>
                          <span className="text-xs text-gray-500">{product.unit}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-blue-600">
                      {vendorNames[product.vendorId] || product.vendorId?.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{product.category}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">₹{product.price}</td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${
                        product.isAvailable 
                          ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {product.isAvailable ? 'ACTIVE' : 'HIDDEN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleVisibility(product)}
                          className={`p-1.5 rounded transition-colors ${
                            product.isAvailable ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={product.isAvailable ? 'Hide' : 'Show'}>
                          {product.isAvailable ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        <button onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
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
