import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store';
import { removeToast, ToastMessage } from '../../store/slices/uiSlice';

import { Check, X, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useAppSelector((state) => state.ui.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3.5 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, 3500);

    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  const icons = {
    success: <Check size={16} strokeWidth={3} />,
    error: <X size={16} strokeWidth={3} />,
    info: <Info size={16} strokeWidth={3} />,
  };

  const colors = {
    success: 'bg-primary-main/95 border-primary-light text-white shadow-[0_4px_18px_rgba(104,156,55,0.25)]',
    error: 'bg-red-500/95 border-red-400 text-white shadow-[0_4px_18px_rgba(239,68,68,0.25)]',
    info: 'bg-[#01B4BA]/95 border-[#01B4BA]/80 text-white shadow-[0_4px_18px_rgba(1,180,186,0.25)]',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      onClick={() => dispatch(removeToast(toast.id))}
      className={`flex items-center gap-4 px-5 py-4 border rounded-2xl cursor-pointer backdrop-blur-md select-none transition-all duration-300 hover:scale-102 ${colors[toast.type]}`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-lg font-bold">
        {icons[toast.type]}
      </div>
      <div className="flex-1 flex flex-col gap-0.5">
        <h4 className="font-poppins font-bold text-sm leading-tight">{toast.title}</h4>
        <p className="font-inter text-xs opacity-90 leading-snug">{toast.message}</p>
      </div>
    </motion.div>
  );
};
