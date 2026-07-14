import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
import { SellerProfilePage } from './pages/buyer/SellerProfilePage';
import { StaticPage } from './pages/buyer/StaticPage';
import { AboutPage } from './pages/buyer/AboutPage';
import { CareersPage } from './pages/buyer/CareersPage';
import { ShippingPolicyPage } from './pages/buyer/ShippingPolicyPage';
import { ReturnsPolicyPage } from './pages/buyer/ReturnsPolicyPage';
import { ManageDevicesPage } from './pages/buyer/ManageDevicesPage';
import { HelpPage } from './pages/buyer/HelpPage';
import { BusinessCardPage } from './pages/buyer/BusinessCardPage';
import { ShopWithPointsPage } from './pages/buyer/ShopWithPointsPage';
import { ReloadBalancePage } from './pages/buyer/ReloadBalancePage';
import { CurrencyConverterPage } from './pages/buyer/CurrencyConverterPage';
import { SearchPage } from './pages/buyer/SearchPage';
import { PackagesPage } from './pages/buyer/PackagesPage';
import { AppPage } from './pages/buyer/AppPage';
import { AcceleratorPage } from './pages/buyer/AcceleratorPage';

// Vendor
import { VendorLayout } from './components/vendor/VendorLayout';
import { VendorDashboard } from './pages/vendor/VendorDashboard';
import { VendorOrdersPage } from './pages/vendor/VendorOrdersPage';
import { VendorProductsPage } from './pages/vendor/VendorProductsPage';
import { VendorProductForm } from './pages/vendor/VendorProductForm';
import { VendorCouponsPage } from './pages/vendor/VendorCouponsPage';
import { VendorSettingsPage } from './pages/vendor/VendorSettingsPage';
import { VendorRegisterPage } from './pages/vendor/VendorRegisterPage';
import { VendorOnboardingStatus } from './pages/vendor/VendorOnboardingStatus';
import { VendorMessagesPage } from './pages/vendor/VendorMessagesPage';
import { VendorStaffPage } from './pages/vendor/VendorStaffPage';
import { VendorReturnsPage } from './pages/vendor/VendorReturnsPage';
import { VendorCustomersPage } from './pages/vendor/VendorCustomersPage';
import { VendorAnalyticsPage } from './pages/vendor/VendorAnalyticsPage';
import { VendorBulkUploadPage } from './pages/vendor/VendorBulkUploadPage';
import { VendorInventoryPage } from './pages/vendor/VendorInventoryPage';
import { VendorShippingPage } from './pages/vendor/VendorShippingPage';
import { VendorFinancePage } from './pages/vendor/VendorFinancePage';
import { VendorReportsPage } from './pages/vendor/VendorReportsPage';
import { VendorNotificationsPage } from './pages/vendor/VendorNotificationsPage';
import { VendorAdvertisingPage } from './pages/vendor/VendorAdvertisingPage';
import { VendorIntegrationsPage } from './pages/vendor/VendorIntegrationsPage';
import { VendorReviewsPage } from './pages/vendor/VendorReviewsPage';

// Admin
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminVendorsPage } from './pages/admin/AdminVendorsPage';
import { AdminBuyersPage } from './pages/admin/AdminBuyersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminTransactionsPage } from './pages/admin/AdminTransactionsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminAuditLogPage } from './pages/admin/AdminAuditLogPage';
import { AdminJobsPage } from './pages/admin/AdminJobsPage';

// Shared
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { SplashScreen } from './components/shared/SplashScreen';
import { ScrollToTop } from './components/shared/ScrollToTop';
import { useAuth } from './hooks/useAuth';

const RoleRedirector = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    // Protect Vendor Routes
    if (user.role === 'vendor' || user.role === 'vendor_admin') {
      if (!location.pathname.startsWith('/vendor')) {
        navigate('/vendor', { replace: true });
      }
    } 
    // Protect Admin Routes
    else if (['admin', 'platform_admin', 'super_admin'].includes(user.role)) {
      if (!location.pathname.startsWith('/admin')) {
        navigate('/admin', { replace: true });
      }
    }
    // Protect Buyer Routes
    else if (user.role === 'buyer') {
      if (location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin')) {
        navigate('/', { replace: true });
      }
    }
  }, [user, location.pathname, navigate]);

  return null;
};

const queryClient = new QueryClient();

export function App() {
  const { loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <RoleRedirector />
        <ScrollToTop />
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
            <Route path="about" element={<AboutPage />} />
            <Route path="careers" element={<CareersPage />} />
            <Route path="shipping-policies" element={<ShippingPolicyPage />} />
            <Route path="returns-policy" element={<ReturnsPolicyPage />} />
            <Route path="manage-devices" element={<ManageDevicesPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="business-card" element={<BusinessCardPage />} />
            <Route path="shop-with-points" element={<ShopWithPointsPage />} />
            <Route path="reload-balance" element={<ReloadBalancePage />} />
            <Route path="currency-converter" element={<CurrencyConverterPage />} />
            <Route path="packages" element={<PackagesPage />} />
            <Route path="app" element={<AppPage />} />
            <Route path="seller/:vendorId" element={<SellerProfilePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="accelerator" element={<AcceleratorPage />} />
            <Route path="*" element={<StaticPage />} />
          </Route>

          {/* Vendor Routes — public onboarding (no auth required) */}
          <Route path="/vendor/register" element={<VendorRegisterPage />} />
          <Route path="/vendor/onboarding-status" element={<VendorOnboardingStatus />} />

          {/* Vendor Panel — protected */}
          <Route path="/vendor" element={
            <ProtectedRoute allowedRoles={['vendor', 'admin']}>
              <VendorLayout />
            </ProtectedRoute>
          }>
            <Route index element={<VendorDashboard />} />
            <Route path="orders" element={<VendorOrdersPage />} />
            <Route path="products" element={<VendorProductsPage />} />
            <Route path="products/new" element={<VendorProductForm />} />
            <Route path="products/edit/:id" element={<VendorProductForm />} />
            <Route path="coupons" element={<VendorCouponsPage />} />
            <Route path="returns" element={<VendorReturnsPage />} />
            <Route path="customers" element={<VendorCustomersPage />} />
            <Route path="settings" element={<VendorSettingsPage />} />
            
            {/* Functional pages registered */}
            <Route path="inventory" element={<VendorInventoryPage />} />
            <Route path="shipping" element={<VendorShippingPage />} />
            <Route path="analytics" element={<VendorAnalyticsPage />} />
            <Route path="finance" element={<VendorFinancePage />} />
            <Route path="reports" element={<VendorReportsPage />} />
            <Route path="messages" element={<VendorMessagesPage />} />
            <Route path="notifications" element={<VendorNotificationsPage />} />
            <Route path="team" element={<VendorStaffPage />} />
            <Route path="advertising" element={<VendorAdvertisingPage />} />
            <Route path="integrations" element={<VendorIntegrationsPage />} />
            <Route path="bulk-upload" element={<VendorBulkUploadPage />} />
            <Route path="reviews" element={<VendorReviewsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'platform_admin', 'super_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="vendors" element={<AdminVendorsPage />} />
            <Route path="buyers" element={<AdminBuyersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="transactions" element={<AdminTransactionsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="audit-log" element={<AdminAuditLogPage />} />
            <Route path="jobs" element={<AdminJobsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
