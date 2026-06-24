import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../types';

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
}

const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'order_update',
    title: 'Order Shipped!',
    message: 'Your order #123456 has been shipped and will arrive in 25 minutes.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actionUrl: '/orders/123456',
  },
  {
    id: 'n2',
    type: 'group_deal',
    title: 'Group Deal Unlocked!',
    message: 'Organic Avocados group deal has been unlocked! Order now at ₹85.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actionUrl: '/?product=1',
  },
  {
    id: 'n3',
    type: 'price_drop',
    title: 'Price Drop Alert',
    message: 'Noise Cancelling Headphones dropped by ₹2,000. Grab it now!',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actionUrl: '/?product=11',
  },
  {
    id: 'n4',
    type: 'promo',
    title: 'Weekend Special Offer',
    message: 'Use code WEEKEND25 for 25% off on all electronics this weekend.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const initialState: NotificationsState = {
  items: SAMPLE_NOTIFICATIONS,
  unreadCount: SAMPLE_NOTIFICATIONS.filter((n) => !n.read).length,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Math.random().toString(36).substring(2, 9),
      };
      state.items.unshift(notification);
      if (!notification.read) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((n) => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((n) => {
        n.read = true;
      });
      state.unreadCount = 0;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const idx = state.items.findIndex((n) => n.id === action.payload);
      if (idx >= 0) {
        if (!state.items[idx].read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items.splice(idx, 1);
      }
    },
    clearAllNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
} = notificationsSlice.actions;
export default notificationsSlice.reducer;
