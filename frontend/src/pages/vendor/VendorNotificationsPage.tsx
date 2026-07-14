import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, BellRing, Check, Circle, Trash2, RefreshCw } from 'lucide-react';
import { vendorApi } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const VendorNotificationsPage: React.FC = () => {
  const { data: notificationsData, isLoading: loading, refetch } = useQuery({
    queryKey: ['vendorNotificationsList'],
    queryFn: async () => {
      const res = await vendorApi.notifications.list();
      return res.data as NotificationItem[];
    }
  });

  const notifications = notificationsData || [];

  const handleMarkRead = async (id: string) => {
    try {
      await vendorApi.notifications.markRead(id);
      refetch();
    } catch (err: any) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await vendorApi.notifications.markAllRead();
      toast.success('All notifications marked as read');
      refetch();
    } catch (err: any) {
      toast.error('Failed to update notifications');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">System Alerts & Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Read alert dispatches, store events, and critical payouts logs.</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all relative z-10"
          >
            <Check className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden divide-y divide-gray-100">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <BellRing className="w-12 h-12 mx-auto text-gray-300" />
            <div>
              <h3 className="font-bold text-gray-700">Inbox is empty</h3>
              <p className="text-sm text-gray-400 mt-1">You will receive system announcements and store warnings here.</p>
            </div>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                n.read ? 'bg-white' : 'bg-orange-50/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.read ? 'bg-gray-100 text-gray-400' : 'bg-orange-500/10 text-orange-500'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm ${n.read ? 'text-gray-700 font-semibold' : 'text-blue-950 font-black'}`}>
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">{n.body}</p>
                  <span className="text-[10px] text-gray-400 font-bold block mt-2">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              
              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-orange-500 transition-colors"
                  title="Mark as Read"
                >
                  <Check className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
