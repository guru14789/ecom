import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Buyer
import { BuyerLayout } from './components/buyer/BuyerLayout';
import { HomePage } from './pages/buyer/HomePage';
import { CheckoutPage } from './pages/buyer/CheckoutPage';
import { OrderSuccessPage } from './pages/buyer/OrderSuccessPage';
import { ProductDetailPage } from './pages/buyer/ProductDetailPage';
import { OrdersPage } from './pages/buyer/OrdersPage';
import { OrderTrackingPage } from './pages/buyer/OrderTrackingPage';
import { ProfilePage } from './pages/buyer/ProfilePage';
import { CategoryPage } from './pages/buyer/CategoryPage';

// Vendor
import { VendorLayout } from './components/vendor/VendorLayout';
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import { VendorOrdersPage } from './pages/vendor/VendorOrdersPage';
import { VendorProductsPage } from './pages/vendor/VendorProductsPage';
import { VendorProductForm } from './pages/vendor/VendorProductForm';
import { VendorCouponsPage } from './pages/vendor/VendorCouponsPage';
import { VendorSettingsPage } from './pages/vendor/VendorSettingsPage';

// Admin
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminVendorsPage } from './pages/admin/AdminVendorsPage';
import { AdminBuyersPage } from './pages/admin/AdminBuyersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Shared
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { SplashScreen } from './components/shared/SplashScreen';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient();

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Buyer Routes */}
          <Route path="/" element={<BuyerLayout />}>
            <Route index element={<HomePage />} />
            <Route path="category/*" element={<CategoryPage />} />
            <Route path="product/:productId" element={<ProductDetailPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderTrackingPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Vendor Routes */}
          <Route path="/vendor" element={
            <ProtectedRoute allowedRoles={['vendor', 'admin']}>
              <VendorLayout />
            </ProtectedRoute>
          }>
            <Route index element={<VendorDashboard />} />
            <Route path="orders" element={<VendorOrdersPage />} />
            <Route path="products" element={<VendorProductsPage />} />
            <Route path="products/new" element={<VendorProductForm />} />
            <Route path="coupons" element={<VendorCouponsPage />} />
            <Route path="settings" element={<VendorSettingsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="vendors" element={<AdminVendorsPage />} />
            <Route path="buyers" element={<AdminBuyersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
