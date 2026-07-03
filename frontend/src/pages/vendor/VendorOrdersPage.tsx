import React, { useState } from 'react';
import { Clock, MapPin, Phone, Printer } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'ready' | 'picked_up';

interface KanbanOrder {
  id: string;
  status: OrderStatus;
  buyerName: string;
  buyerPhone: string;
  address: string;
  total: number;
  items: number;
  timeElapsed: string;
}

const MOCK_ORDERS: KanbanOrder[] = [
  { id: 'ORD-001', status: 'new', buyerName: 'Rahul K.', buyerPhone: '9876543210', address: 'HSR Layout, Sec 4', total: 340, items: 3, timeElapsed: '2m' },
  { id: 'ORD-002', status: 'new', buyerName: 'Priya S.', buyerPhone: '9876543211', address: 'Koramangala 3rd Block', total: 1250, items: 8, timeElapsed: '5m' },
  { id: 'ORD-003', status: 'confirmed', buyerName: 'Amit V.', buyerPhone: '9876543212', address: 'Indiranagar 1st Stage', total: 45, items: 1, timeElapsed: '8m' },
  { id: 'ORD-004', status: 'preparing', buyerName: 'Neha M.', buyerPhone: '9876543213', address: 'BTM Layout', total: 670, items: 5, timeElapsed: '12m' },
  { id: 'ORD-005', status: 'ready', buyerName: 'Suresh D.', buyerPhone: '9876543214', address: 'Jayanagar 4th T Block', total: 890, items: 6, timeElapsed: '15m' },
];

const COLUMNS: { id: OrderStatus; title: string; color: string }[] = [
  { id: 'new', title: 'New', color: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'confirmed', title: 'Confirmed', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'preparing', title: 'Preparing', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { id: 'ready', title: 'Ready', color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'picked_up', title: 'Picked Up', color: 'bg-gray-50 text-gray-700 border-gray-200' },
];

export const VendorOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState(MOCK_ORDERS);

  const moveOrder = (id: string, newStatus: OrderStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const nextStatus = (current: OrderStatus): OrderStatus | null => {
    const idx = COLUMNS.findIndex(c => c.id === current);
    return idx < COLUMNS.length - 1 ? COLUMNS[idx + 1].id : null;
  };

  const handleGenerateLabel = async (orderId: string) => {
    try {
      toast.loading('Connecting to Delhivery...', { id: 'label' });
      const generateLabelFn = httpsCallable(functions, 'generateShippingLabel');
      
      // We pass a dummy waybill for the mock order, 
      // in production this would be order.delhiveryWaybill
      const response = await generateLabelFn({ waybills: [`AWB_${orderId}`] });
      const { pdfUrls, isMock } = response.data as any;
      
      toast.success(isMock ? 'Mock label generated!' : 'Label generated successfully!', { id: 'label' });
      
      // Trigger download
      if (pdfUrls && pdfUrls.length > 0) {
        window.open(pdfUrls[0], '_blank');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate shipping label from Delhivery.', { id: 'label' });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Live Orders</h2>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Auto-updating
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 min-w-max h-full pb-4">
          {COLUMNS.map(column => {
            const columnOrders = orders.filter(o => o.status === column.id);
            return (
              <div key={column.id} className="w-80 flex flex-col h-full">
                {/* Column Header */}
                <div className={`px-4 py-3 rounded-t-xl border-x border-t font-bold flex items-center justify-between ${column.color}`}>
                  <span>{column.title}</span>
                  <span className="bg-white/50 px-2 py-0.5 rounded-full text-sm">{columnOrders.length}</span>
                </div>
                
                {/* Column Body */}
                <div className="flex-1 bg-gray-100 border-x border-b rounded-b-xl p-3 space-y-3 overflow-y-auto min-h-[500px]">
                  {columnOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-gray-900">{order.id}</span>
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {order.timeElapsed}
                        </span>
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">{order.buyerName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" /> {order.buyerPhone}
                        </div>
                        <div className="text-xs text-gray-500 flex items-start gap-1 mt-1">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5" /> <span className="line-clamp-2">{order.address}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm border-t pt-3">
                        <span className="text-gray-600">{order.items} items</span>
                        <span className="font-bold text-gray-900">₹{order.total}</span>
                      </div>

                      {/* Action Button */}
                      <div className="flex flex-col gap-2 mt-2">
                        {order.status !== 'new' && order.status !== 'picked_up' && (
                          <button 
                            onClick={() => handleGenerateLabel(order.id)}
                            className="w-full flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium py-1.5 rounded transition-colors text-sm"
                          >
                            <Printer className="h-4 w-4" /> Print Label
                          </button>
                        )}
                        {nextStatus(order.status) && (
                          <button 
                            onClick={() => moveOrder(order.id, nextStatus(order.status)!)}
                            className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white font-medium py-1.5 rounded transition-colors text-sm"
                          >
                            Mark {COLUMNS.find(c => c.id === nextStatus(order.status))?.title}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {columnOrders.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
