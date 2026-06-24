import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Package, Tag, TrendingDown, RefreshCcw, Megaphone, Settings, Check, Trash2, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { markAsRead, markAllAsRead, removeNotification } from '../store/slices/notificationsSlice';
import { Notification, NotificationType } from '../types';

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string }> = {
  order_update:   { icon: <Package size={16} />,     color: 'text-blue-600',   bg: 'bg-blue-100' },
  group_deal:     { icon: <RefreshCcw size={16} />,  color: 'text-purple-600', bg: 'bg-purple-100' },
  price_drop:     { icon: <TrendingDown size={16} />,color: 'text-rose-600',   bg: 'bg-rose-100' },
  back_in_stock:  { icon: <RefreshCcw size={16} />,  color: 'text-emerald-600',bg: 'bg-emerald-100' },
  promo:          { icon: <Tag size={16} />,          color: 'text-amber-600',  bg: 'bg-amber-100' },
  system:         { icon: <Megaphone size={16} />,   color: 'text-slate-600',  bg: 'bg-slate-100' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;

  const handleClick = () => {
    dispatch(markAsRead(notification.id));
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, scale: 0.95 }}
      className={`relative flex items-start gap-3.5 p-4 rounded-2xl transition-all cursor-pointer group ${
        notification.read ? 'bg-white border border-slate-100' : 'bg-primary-main/5 border border-primary-main/15 shadow-sm'
      }`}
      onClick={handleClick}
    >
      {/* Unread dot */}
      {!notification.read && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-primary-main rounded-full" />
      )}

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-10">
        <p className="font-poppins font-bold text-sm text-slate-800 leading-snug">{notification.title}</p>
        <p className="font-inter text-xs text-slate-500 mt-0.5 leading-relaxed">{notification.message}</p>
        <span className="font-inter text-[10px] text-slate-400 font-medium mt-1 block">
          {timeAgo(notification.createdAt)}
        </span>
      </div>

      {/* Actions on hover */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <button
            onClick={(e) => { e.stopPropagation(); dispatch(markAsRead(notification.id)); }}
            className="p-1.5 rounded-lg hover:bg-primary-main/10 text-primary-main"
            title="Mark as read"
          >
            <Check size={12} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); dispatch(removeNotification(notification.id)); }}
          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400"
          title="Remove"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
};

type FilterType = 'all' | NotificationType;

export const Notifications: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, unreadCount } = useAppSelector((state) => state.notifications);
  const [filter, setFilter] = useState<FilterType>('all');

  const FILTER_TABS: Array<{ key: FilterType; label: string }> = [
    { key: 'all',           label: 'All' },
    { key: 'order_update',  label: 'Orders' },
    { key: 'group_deal',    label: 'Group Deals' },
    { key: 'price_drop',    label: 'Price Drops' },
    { key: 'promo',         label: 'Offers' },
  ];

  const filtered = filter === 'all' ? items : items.filter((n) => n.type === filter);
  const unreadFiltered = filtered.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-poppins font-extrabold text-xl text-slate-800 flex items-center gap-2">
              <Bell size={20} className="text-primary-main" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-primary-main text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadFiltered > 0 && (
            <button
              onClick={() => dispatch(markAllAsRead())}
              className="font-poppins font-bold text-xs text-primary-main hover:underline"
            >
              Mark all read
            </button>
          )}
          <button
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
            title="Notification settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-shrink-0 font-poppins font-bold text-xs px-4 py-2 rounded-full border transition-all ${
              filter === tab.key
                ? 'bg-primary-main text-white border-primary-main shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-5 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
              <Bell size={36} className="text-slate-300" />
            </div>
            <div>
              <h3 className="font-poppins font-bold text-lg text-slate-600">All caught up!</h3>
              <p className="font-inter text-sm text-slate-400 mt-1">No notifications in this category.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="list" className="flex flex-col gap-2.5">
            <AnimatePresence>
              {filtered.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
