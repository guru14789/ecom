import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { CartDrawer } from './components/layout/CartDrawer';
import { ProfileDrawer } from './components/layout/ProfileDrawer';
import { LoginModal } from './components/ui/LoginModal';
import { AddressModal } from './components/ui/AddressModal';
import ProtectedRoute from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Payment } from './pages/Payment';
import { Workflows } from './pages/Workflows';
import { Wishlist } from './pages/Wishlist';
import { Orders } from './pages/Orders';
import { Profile } from './pages/Profile';
import { Notifications } from './pages/Notifications';
import { SearchPage } from './pages/SearchPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { useAppDispatch, useAppSelector } from './store';
import { removeToast } from './store/slices/uiSlice';
import { useSocket } from './hooks/useSocket';

// ─── Global Toast Container ──────────────────────────────────
const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        dispatch(removeToast(toasts[0].id));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts, dispatch]);

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.10)] border font-inter text-xs font-semibold backdrop-blur-md animate-slide-in pointer-events-auto flex items-start gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-50/95 border-rose-200 text-rose-800'
              : 'bg-blue-50/95 border-blue-200 text-blue-800'
          }`}
        >
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
            toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
          }`} />
          <div className="flex flex-col gap-0.5 flex-1">
            <span className="font-bold text-slate-800 font-poppins text-sm">{toast.title}</span>
            <span className="opacity-80 leading-relaxed">{toast.message}</span>
          </div>
          <button
            onClick={() => dispatch(removeToast(toast.id))}
            className="opacity-40 hover:opacity-70 transition-opacity text-current ml-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────
const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const user = useAppSelector((state) => state.auth.user);
  useSocket(user?.isLoggedIn ? 'authenticated' : null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      document.body.classList.add('loaded');
      window.scrollTo(0, 0);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      {loading && (
        <div className="loading-screen" id="loading-screen">
          <div className="loading-container">
            <img src="/logo.png" alt="Loading" className="logo-animation" />
          </div>
        </div>
      )}

      <div className="min-h-screen bg-bg-light flex flex-col justify-between overflow-x-hidden font-inter text-slate-700 antialiased">
        <Header />

        <main className="flex-grow w-full">
          <Routes>
            <Route path="/"              element={<Home />} />
            <Route path="/login"         element={<Login />} />
            <Route path="/workflows"     element={<Workflows />} />
            <Route path="/wishlist"      element={<Wishlist />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/search"        element={<SearchPage />} />
            <Route path="/product/:id"   element={<ProductDetail />} />
            <Route path="/cart"          element={<Cart />} />
            <Route path="/payment"       element={<ProtectedRoute><Payment /></ProtectedRoute>} />
            <Route path="/checkout"      element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/orders"        element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/orders/:id"    element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            {/* 404 fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>

        <Footer />
        <BottomNav />

        {/* Global Drawer Systems */}
        <CartDrawer />
        <ProfileDrawer />

        {/* Global Modal triggers */}
        <LoginModal />
        <AddressModal />

        {/* Dynamic global alerts */}
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
};

export default App;
