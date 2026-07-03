import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';

const MOCK_ORDERS = [
  {
    id: 'ord_12345',
    status: 'out_for_delivery',
    total: 340,
    items: [{ name: 'Farm Fresh Organic Bananas', qty: 2 }],
    date: new Date().toISOString(),
    eta: '5 mins',
  },
  {
    id: 'ord_98765',
    status: 'delivered',
    total: 1250,
    items: [{ name: 'Amul Butter', qty: 1 }, { name: 'Whole Wheat Bread', qty: 2 }],
    date: new Date(Date.now() - 86400000).toISOString(),
    eta: null,
  }
];

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const activeOrders = MOCK_ORDERS.filter(o => !['delivered', 'cancelled', 'refunded'].includes(o.status));
  const pastOrders = MOCK_ORDERS.filter(o => ['delivered', 'cancelled', 'refunded'].includes(o.status));

  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {/* Tabs */}
      <div className="flex border-b">
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Active Orders
        </button>
        <button 
          onClick={() => setActiveTab('past')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'past' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Past Orders
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {displayOrders.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No orders found in this category.</p>
          </div>
        ) : (
          displayOrders.map(order => (
            <div 
              key={order.id} 
              onClick={() => navigate(`/orders/${order.id}`)}
              className="bg-white border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">Order #{order.id.slice(-5)}</span>
                    {order.status === 'out_for_delivery' && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Arriving in {order.eta}
                      </span>
                    )}
                    {order.status === 'delivered' && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Delivered
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(order.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="font-bold text-lg">
                  ₹{order.total}
                </div>
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 line-clamp-1">
                  {order.items.map(i => `${i.qty} x ${i.name}`).join(', ')}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
