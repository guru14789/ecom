import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle, ArrowUpDown, Check, RefreshCw } from 'lucide-react';
import { vendorApi } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  isAvailable: boolean;
}

export const VendorInventoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const { data: productsData, isLoading: loading, refetch } = useQuery({
    queryKey: ['vendorInventory'],
    queryFn: async () => {
      const res = await vendorApi.products.list();
      return res.data as InventoryItem[];
    }
  });

  const products = productsData || [];

  const handleUpdateStock = async (id: string) => {
    try {
      const currentProduct = products.find(p => p.id === id);
      if (!currentProduct) return;
      
      await vendorApi.products.update(id, {
        ...currentProduct,
        stock: newStockVal
      });
      
      toast.success('Stock level updated successfully');
      setEditingStockId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update stock');
    }
  };

  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => !lowStockFilter || p.stock <= 10);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Stock Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor stock levels, set alerts, and update available counts instantly.</p>
        </div>
        
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-4 py-2 text-sm font-bold rounded-xl border transition-all flex items-center gap-2 ${
              lowStockFilter 
                ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                : 'bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Low Stock (≤10)
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search items by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Product Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Stock Quantity</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isLowStock = product.stock <= 10;
                  const isOutOfStock = product.stock === 0;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 truncate max-w-xs">{product.name}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{product.category}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{product.price}</td>
                      <td className="px-6 py-4">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-700">Low Stock</span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700">In Stock</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingStockId === product.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={newStockVal}
                              onChange={(e) => setNewStockVal(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-20 px-2 py-1 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                            />
                            <button
                              onClick={() => handleUpdateStock(product.id)}
                              className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className={`font-bold ${isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>{product.stock} pcs</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingStockId !== product.id ? (
                          <button
                            onClick={() => {
                              setEditingStockId(product.id);
                              setNewStockVal(product.stock);
                            }}
                            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition-colors"
                          >
                            Adjust Stock
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingStockId(null)}
                            className="text-xs font-bold text-gray-500 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
