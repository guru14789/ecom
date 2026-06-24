import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import Users from './pages/Users';
import Products from './pages/Products';
import Orders from './pages/Orders';
import ActivityLog from './pages/ActivityLog';
import VendorOnboarding from './pages/VendorOnboarding';
import Analytics from './pages/Analytics';
import GroupSessions from './pages/GroupSessions';
import CategoryManager from './pages/CategoryManager';
import CommissionConfig from './pages/CommissionConfig';
import SalesEvents from './pages/SalesEvents';
import Disputes from './pages/Disputes';
import Reports from './pages/Reports';
import Login from './pages/Login';
import ProductApproval from './pages/ProductApproval';
import UserManagement from './pages/UserManagement';
import ReportsDashboard from './pages/ReportsDashboard';
import NotificationTemplates from './pages/NotificationTemplates';
import Promotions from './pages/Promotions';
import Settings from './pages/Settings';

const App: React.FC = () => {
  useLocation();
  const token = localStorage.getItem('admin_token');

  if (!token) {
    return (
      <Routes>
        <Route path="/*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5FEFE] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/users" element={<Users />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/activity" element={<ActivityLog />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/group-sessions" element={<GroupSessions />} />
            <Route path="/categories" element={<CategoryManager />} />
            <Route path="/notification-templates" element={<NotificationTemplates />} />
            <Route path="/reports-dashboard" element={<ReportsDashboard />} />
            <Route path="/commissions" element={<CommissionConfig />} />
            <Route path="/onboarding" element={<VendorOnboarding />} />
            <Route path="/sales-events" element={<SalesEvents />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/product-approval" element={<ProductApproval />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
